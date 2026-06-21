# Cách tích hợp webhook SePay vào server

## Tích hợp webhook SePay vào server: cấu trúc payload, phản hồi hợp lệ, chống trùng lặp giao dịch và code mẫu đầy đủ bằng PHP và Node.js.

<Callout type="info" title="Cần test trước?">
Dùng 
Test mode
 để thử webhook bằng giao dịch mô phỏng mà không ảnh hưởng dữ liệu thật.
</Callout>

Mỗi khi có giao dịch, endpoint (URL nhận webhook) của bạn nhận một HTTP POST từ SePay. Trả về HTTP 200 kèm body `{"success": true}` trong vòng 30 giây là kết thúc. Nếu thất bại, SePay tự gửi lại theo [lịch retry](./xu-ly-loi#lich-retry).

## Payload

#### Các bước tích hợp WebHooks

Mỗi khi có giao dịch khớp với cấu hình webhook, SePay sẽ gửi HTTP POST đến endpoint của bạn:

<Response title="JSON">
```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```
</Response>

| Trường            | Kiểu    | Null / rỗng?  | Ghi chú                                                                                                                                                                                                                        |
| ----------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | integer | không         | ID giao dịch trên SePay. Giá trị này không đổi qua mọi lần retry và replay, dùng làm khóa chống trùng.                                                                                                                         |
| `gateway`         | string  | không         | Tên ngân hàng của giao dịch (ví dụ `Vietcombank`, `BIDV`, `TPBank`).                                                                                                                                                           |
| `transactionDate` | string  | không         | Định dạng `YYYY-MM-DD HH:mm:ss`, giờ Việt Nam.                                                                                                                                                                                 |
| `accountNumber`   | string  | không         | Số tài khoản ngân hàng.                                                                                                                                                                                                        |
| `subAccount`      | string  | có thể rỗng   | VA khớp giao dịch. **VA chính thức**: số VA khách chuyển vào. **TKP** (VA nội dung): mã định danh trong nội dung chuyển khoản. Rỗng `""` nếu không khớp.                                                                       |
| `code`            | string  | có thể `null` | Mã thanh toán (ví dụ `DH123456`), trích từ nội dung theo tiền tố ở **Công ty → [Cấu hình chung](https://my.sepay.vn/company/configuration) → Cấu trúc mã thanh toán**. Không liên quan VA. `null` khi không khớp cấu hình nào. |
| `content`         | string  | không         | Nội dung chuyển khoản gốc từ ngân hàng, SePay không qua xử lý.                                                                                                                                                                 |
| `transferType`    | string  | không         | `in` (tiền vào) hoặc `out` (tiền ra).                                                                                                                                                                                          |
| `description`     | string  | có thể rỗng   | Mô tả đầy đủ từ ngân hàng. Một số ngân hàng không hỗ trợ, khi đó rỗng.                                                                                                                                                         |
| `transferAmount`  | integer | không         | Số tiền giao dịch, đơn vị VNĐ, luôn dương.                                                                                                                                                                                     |
| `accumulated`     | integer | có thể `0`    | Số dư sau giao dịch. Một số ngân hàng không hỗ trợ trả số dư, khi đó là `0`.                                                                                                                                                   |
| `referenceCode`   | string  | có thể rỗng   | Mã tham chiếu từ ngân hàng.                                                                                                                                                                                                    |

<Callout type="tip" title="Phân biệt null với chuỗi rỗng">
`code = null`
 nghĩa là không có mã thanh toán, khác với mã rỗng. Cả 
`null`
 và 
`""`
 đều falsy trong PHP/JS, nếu cần phân biệt thì dùng 
`$code === null`
 thay vì 
`if ($code)`
.
</Callout>

## Phản hồi hợp lệ

SePay chỉ tính là thành công khi phản hồi đủ 3 điều:

1. HTTP status **200** hoặc **201**.
2. Body là JSON có `success: true`, đúng y nguyên dạng `{"success": true}`.
3. Hoàn tất trong **30 giây**.

Sai một trong ba điều trên là tính thất bại, kể cả khi server bạn đã nhận được request:

| Phản hồi                                                      | SePay hiểu là       |
| ------------------------------------------------------------- | ------------------- |
| `200` hoặc `201` + `{"success": true}`                        | Thành công          |
| `200` + body khác (ví dụ `{"status": "ok"}` hoặc rỗng)        | Thất bại (sai body) |
| Status khác `200`/`201` (kể cả `202`, redirect, `4xx`, `5xx`) | Thất bại            |
| Không trả trong 30s                                           | Timeout             |

<Callout type="tip" title="200 chỉ có nghĩa là đã nhận">
Trả 200 ngay rồi đẩy xử lý sang queue hoặc background job. SePay chỉ cần biết endpoint đã nhận request. Xử lý đồng bộ chờ lâu dễ timeout, không nên.
</Callout>

## Content-Type

| Giá trị                             | Cách đọc                                |
| ----------------------------------- | --------------------------------------- |
| `application/json` (mặc định)       | `json_decode($body)` hoặc `req.body`    |
| `multipart/form-data`               | `$_POST['field']` hoặc `req.body.field` |
| `application/x-www-form-urlencoded` | `parse_str()` hoặc form parser          |

## Chống trùng lặp

Cùng một giao dịch có thể gửi webhook nhiều lần do:

* **Retry tự động** khi endpoint trả lỗi (xem [Xử lý lỗi](./xu-ly-loi#lich-retry))
* **Gửi lại thủ công** từ trang quản lý webhook. Admin có thể replay cả log đã thành công
* **Nhiều webhook trỏ về cùng endpoint** trong cùng một công ty

Đặt `transaction_id` là cột `UNIQUE` rồi dùng `INSERT IGNORE`. Cách này chặn trùng ngay từ database, an toàn cả khi 2 webhook đến đồng thời:

<!-- No code tabs available -->

<Callout type="warn">
Nếu không kiểm tra trùng, bạn có thể cộng tiền hai lần hoặc xác nhận đơn hàng lặp lại. Endpoint không idempotent (an toàn khi gọi nhiều lần) thì chỉ một cú bấm replay cũng có thể tạo ra hàng loạt giao dịch giả.
</Callout>

## Code mẫu

Hướng dẫn đầy đủ sẵn cho production (schema, HMAC, idempotent, checklist production):

* [Lập trình webhook SePay với PHP](./lap-trinh-webhooks/lap-trinh-webhook): PHP 8 + PDO + MySQL
* [Lập trình webhook SePay với Node.js (Express)](./lap-trinh-webhooks/lap-trinh-webhook-nodejs): Express + mysql2

Laravel user có thể dùng package [sepayvn/laravel-sepay](https://github.com/sepayvn/laravel-sepay).

## Tiếp theo

* [Xác thực](./xac-thuc): HMAC-SHA256, API Key, OAuth 2.0
* [Bảo mật](./bao-mat): HTTPS, whitelist IP, chống replay, kiểm tra dữ liệu
* [Xử lý lỗi](./xu-ly-loi): lịch retry + chẩn đoán



# Tạo trang QR thanh toán

## Tích hợp QR chuyển khoản với webhook SePay để tự xác nhận đơn hàng ngay khi tiền vào tài khoản, kèm code mẫu PHP và Node.js sẵn dùng.

Khách đặt hàng → thấy QR → quét bằng app ngân hàng → chuyển khoản → SePay gửi webhook → server của bạn cập nhật đơn hàng → trang thanh toán tự chuyển sang **Thành công**. Toàn bộ luồng này xong trong 1 file HTML + 3 endpoint backend.

<Callout type="info" title="Yêu cầu">
Liên kết tài khoản ngân hàng trên 
my.sepay.vn
Tạo webhook nhận giao dịch, xem 
Bắt đầu nhanh
Cấu hình 
mã thanh toán
 tại 
Công ty → Cấu hình chung → Cấu trúc mã thanh toán
</Callout>

## Luồng hoạt động

<Mermaid title="Luồng thanh toán QR + Webhook">
sequenceDiagram
  participant C as Khách
  participant FE as Frontend
  participant BE as Backend
  participant S as SePay
  participant NH as Ngân hàng

  C->>FE: Bấm Thanh toán
  FE->>BE: POST /api/orders (tạo đơn)
  BE->>FE: {code, qrUrl}
  FE->>C: Hiển thị QR + đếm ngược
  C->>NH: Quét QR, xác nhận
  NH->>S: Thông báo giao dịch
  S->>BE: POST /webhook/sepay
  BE->>BE: UPDATE orders SET status='paid'
  loop mỗi 3 giây
    FE->>BE: GET /api/orders/:code/status
  end
  BE-->>FE: {status: 'paid'}
  FE->>C: Thanh toán thành công
</Mermaid>

## URL tạo QR

SePay sinh ảnh QR qua endpoint `qr.sepay.vn/img`. App ngân hàng quét mã sẽ điền sẵn số tài khoản, số tiền, nội dung.

```
https://qr.sepay.vn/img?acc={SO_TK}&bank={NGAN_HANG}&amount={TIEN}&des={NOI_DUNG}
```

<ParamsTable
  rows={[
{ "name": "acc", "type": "string", "required": true, "description": "Số tài khoản thụ hưởng" },
{ "name": "bank", "type": "string", "required": true, "description": "Mã ngắn ngân hàng. Danh sách: <a href='https://qr.sepay.vn/banks.json' target='_blank'>qr.sepay.vn/banks.json</a>" },
{ "name": "amount", "type": "integer", "required": false, "description": "Số tiền (VND)" },
{ "name": "des", "type": "string", "required": false, "description": "Nội dung chuyển khoản (URL-encode)" }
]}
/>

Ví dụ:

```
https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=DH12345
```

<Image src="/images/user-guide/qr-1.png" alt="QR code thanh toán mẫu" caption="Mã QR chuyển khoản với số tiền và nội dung điền sẵn" />

Chi tiết đầy đủ: [Tạo và nhúng QR Code](/vi/tien-ich-khac/tao-qr-code).

## Frontend: Trang thanh toán

Frontend hiển thị QR kèm bộ đếm ngược. Mỗi 3 giây, frontend gọi API kiểm tra trạng thái đơn. Khi hết 15 phút mà chưa thanh toán thì đánh dấu hết hạn.

<CodeTabs>
  <Code label="HTML + JavaScript">
    ```js
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Thanh toán đơn hàng</title>
      <style>
        :root { color-scheme: light dark; }
        body { font-family: system-ui, sans-serif; background: #f5f5f5;
               min-height: 100dvh; margin: 0; display: grid; place-items: center; padding: 1rem; }
        .card { width: min(100%, 28rem); background: #fff; border-radius: 1rem;
                overflow: hidden; box-shadow: 0 4px 24px rgb(0 0 0 / 0.08); }
        .card header { background: #1a56db; color: #fff; padding: 1.25rem; text-align: center; }
        .card header strong { display: block; font-size: 1.75rem; }
        .card main { padding: 1.5rem; display: grid; gap: 1rem; }
        .qr { width: 15rem; height: 15rem; margin: 0 auto; }
        dl { background: #f8fafc; border-radius: .5rem; padding: 1rem; margin: 0;
             display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; font-size: .9rem; }
        dt { color: #6b7280; } dd { margin: 0; font-weight: 600; text-align: right; }
        .status { padding: .75rem; border-radius: .5rem; text-align: center; font-weight: 600; }
        .status[data-state="waiting"] { background: #fef3c7; color: #92400e; }
        .status[data-state="paid"]    { background: #d1fae5; color: #065f46; }
        .status[data-state="expired"] { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <article class="card">
        <header>
          <div>Thanh toán đơn hàng</div>
          <strong id="amount"></strong>
        </header>
        <main>
          <img id="qr" class="qr" alt="QR code thanh toán">
          <p>Mở app ngân hàng → Quét QR → Xác nhận</p>
          <dl>
            <dt>Ngân hàng</dt>    <dd id="bank"></dd>
            <dt>Số tài khoản</dt> <dd id="account"></dd>
            <dt>Nội dung</dt>     <dd id="content"></dd>
          </dl>
          <div id="status" class="status" data-state="waiting"></div>
        </main>
      </article>
    
      <script type="module">
        const ORDER = {
          code: 'DH12345', amount: 100000,
          bank: 'Vietcombank', accountNumber: '0010000000355',
        };
    
        const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
        const $ = (id) => document.getElementById(id);
    
        // Điền thông tin + QR
        $('amount').textContent  = vnd.format(ORDER.amount);
        $('bank').textContent    = ORDER.bank;
        $('account').textContent = ORDER.accountNumber;
        $('content').textContent = ORDER.code;
        $('qr').src = `https://qr.sepay.vn/img?${new URLSearchParams({
          acc: ORDER.accountNumber, bank: ORDER.bank,
          amount: ORDER.amount, des: ORDER.code,
        })}`;
    
        // Poll trạng thái đơn hàng
        const deadline = Date.now() + 15 * 60_000;
        const status = $('status');
    
        async function tick() {
          const left = deadline - Date.now();
          if (left <= 0) {
            status.dataset.state = 'expired';
            status.textContent = 'Đơn hàng đã hết hạn';
            return;
          }
    
          const mm = String(Math.floor(left / 60_000)).padStart(2, '0');
          const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');
    
          try {
            const res = await fetch(`/api/orders/${ORDER.code}/status`);
            const data = await res.json();
            if (data.status === 'paid') {
              status.dataset.state = 'paid';
              status.textContent = 'Thanh toán thành công';
              return;
            }
          } catch {}
    
          status.textContent = `Đang chờ thanh toán · ${mm}:${ss}`;
          setTimeout(tick, 3000);
        }
        tick();
      </script>
    </body>
    </html>
    ```
  </Code>
  <Code label="React / Next.js">
    ```js
    'use client';
    import { useEffect, useState } from 'react';
    
    type Order = {
      code: string;
      amount: number;
      bank: string;
      accountNumber: string;
    };
    
    type Status = 'waiting' | 'paid' | 'expired';
    
    const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    
    export function PaymentCard({ order, timeoutMs = 15 * 60_000 }: {
      order: Order;
      timeoutMs?: number;
    }) {
      const [status, setStatus] = useState<Status>('waiting');
      const [msLeft, setMsLeft] = useState(timeoutMs);
    
      const qrUrl = `https://qr.sepay.vn/img?${new URLSearchParams({
        acc: order.accountNumber, bank: order.bank,
        amount: String(order.amount), des: order.code,
      })}`;
    
      // Poll trạng thái + đếm ngược
      useEffect(() => {
        if (status !== 'waiting') return;
        const deadline = Date.now() + timeoutMs;
        const ctrl = new AbortController();
    
        const id = setInterval(async () => {
          const left = deadline - Date.now();
          if (left <= 0) return setStatus('expired');
          setMsLeft(left);
    
          try {
            const res = await fetch(`/api/orders/${order.code}/status`, { signal: ctrl.signal });
            const { status: s } = await res.json();
            if (s === 'paid') setStatus('paid');
          } catch {}
        }, 1000);
    
        return () => { clearInterval(id); ctrl.abort(); };
      }, [order.code, status, timeoutMs]);
    
      const mm = String(Math.floor(msLeft / 60_000)).padStart(2, '0');
      const ss = String(Math.floor((msLeft % 60_000) / 1000)).padStart(2, '0');
    
      return (
        <article className="card">
          <header>
            <div>Thanh toán đơn hàng</div>
            <strong>{vnd.format(order.amount)}</strong>
          </header>
          <main>
            <img src={qrUrl} alt="QR code thanh toán" width={240} height={240} />
            <p>Mở app ngân hàng → Quét QR → Xác nhận</p>
            <dl>
              <dt>Ngân hàng</dt>    <dd>{order.bank}</dd>
              <dt>Số tài khoản</dt> <dd>{order.accountNumber}</dd>
              <dt>Nội dung</dt>     <dd>{order.code}</dd>
            </dl>
            <div className="status" data-state={status}>
              {status === 'paid'    && 'Thanh toán thành công'}
              {status === 'expired' && 'Đơn hàng đã hết hạn'}
              {status === 'waiting' && `Đang chờ thanh toán · ${mm}:${ss}`}
            </div>
          </main>
        </article>
      );
    }
    ```
  </Code>
</CodeTabs>

<Callout type="tip" title="Nên dùng Polling hay Server-Sent Events?">
Polling 3 giây/lần đơn giản, đủ nhanh cho UX thanh toán. Nếu dùng cùng backend cho nhiều đơn hàng, cân nhắc 
SSE
 (
`EventSource`
) hoặc 
WebSocket
 để server đẩy sự kiện thay vì client hỏi. Khi đó webhook handler chỉ cần 
`pubsub.publish(code, 'paid')`
 sau khi 
`UPDATE`
.
</Callout>

## Backend: 3 endpoint

1. `POST /api/orders`: tạo đơn, trả mã + QR URL.
2. `GET /api/orders/:code/status`: frontend poll.
3. `POST /webhook/sepay`: nhận webhook từ SePay.

<CodeTabs>
  <Code label="PHP">
    ```php
    <?php
    // db.php
    $pdo = new PDO('mysql:host=localhost;dbname=myshop;charset=utf8mb4', 'user', 'pass',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // --- POST /api/orders ---------------------------------------------
    require 'db.php';
    header('Content-Type: application/json');
    
    $code   = 'DH' . bin2hex(random_bytes(6));
    $amount = (int) ($_POST['amount'] ?? 100000);
    
    $pdo->prepare('INSERT INTO orders (code, amount, status) VALUES (?, ?, \'pending\')')
        ->execute([$code, $amount]);
    
    echo json_encode([
        'code'          => $code,
        'amount'        => $amount,
        'bank'          => 'Vietcombank',
        'accountNumber' => '0010000000355',
        'qrUrl'         => 'https://qr.sepay.vn/img?' . http_build_query([
            'acc' => '0010000000355', 'bank' => 'Vietcombank',
            'amount' => $amount, 'des' => $code,
        ]),
    ]);
    
    
    // --- GET /api/orders/:code/status ---------------------------------
    require 'db.php';
    header('Content-Type: application/json');
    
    $stmt = $pdo->prepare('SELECT status FROM orders WHERE code = ?');
    $stmt->execute([$_GET['code'] ?? '']);
    echo json_encode(['status' => $stmt->fetchColumn() ?: 'not_found']);
    
    
    // --- POST /webhook/sepay ------------------------------------------
    require 'db.php';
    header('Content-Type: application/json');
    
    // 1. Xác thực API Key (constant-time)
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!hash_equals('Apikey ' . getenv('SEPAY_API_KEY'), $auth)) {
        http_response_code(401);
        echo json_encode(['success' => false]);
        exit;
    }
    
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    
    // 2. Chống trùng: UNIQUE(transaction_id) + INSERT IGNORE (race-safe)
    $log = $pdo->prepare('INSERT IGNORE INTO webhook_logs (transaction_id, body) VALUES (?, ?)');
    $log->execute([$data['id'], $body]);
    if ($log->rowCount() === 0) {
        echo json_encode(['success' => true]); // đã xử lý trước đó
        exit;
    }
    
    // 3. UPDATE atomic: chỉ đổi pending → paid nếu tiền đủ
    if ($data['transferType'] === 'in' && !empty($data['code'])) {
        $pdo->prepare(
            'UPDATE orders SET status = \'paid\', paid_at = NOW()
             WHERE code = ? AND status = \'pending\' AND amount <= ?'
        )->execute([$data['code'], $data['transferAmount']]);
    
        // TODO: enqueue email / cập nhật kho
    }
    
    echo json_encode(['success' => true]);
    ```
  </Code>
  <Code label="Node.js">
    ```js
    // server.js
    import express, { Router } from 'express';
    import crypto from 'node:crypto';
    import mysql from 'mysql2/promise';
    
    const db = mysql.createPool({
      host: 'localhost', user: 'user', password: 'pass', database: 'myshop',
    });
    
    const app = express();
    app.use(express.json());
    
    // --- /api/orders --------------------------------------------------
    const orders = Router();
    
    orders.post('/', async (req, res) => {
      const code   = 'DH' + crypto.randomBytes(6).toString('hex');
      const amount = Number(req.body.amount) || 100000;
    
      await db.execute(
        'INSERT INTO orders (code, amount, status) VALUES (?, ?, ?)',
        [code, amount, 'pending'],
      );
    
      const qr = new URLSearchParams({
        acc: '0010000000355', bank: 'Vietcombank',
        amount: String(amount), des: code,
      });
    
      res.json({
        code, amount,
        bank: 'Vietcombank',
        accountNumber: '0010000000355',
        qrUrl: `https://qr.sepay.vn/img?${qr}`,
      });
    });
    
    orders.get('/:code/status', async (req, res) => {
      const [rows] = await db.execute(
        'SELECT status FROM orders WHERE code = ?',
        [req.params.code],
      );
      res.json({ status: rows[0]?.status ?? 'not_found' });
    });
    
    app.use('/api/orders', orders);
    
    // --- /webhook/sepay -----------------------------------------------
    app.post('/webhook/sepay', async (req, res) => {
      // 1. Xác thực API Key
      if (req.headers.authorization !== `Apikey ${process.env.SEPAY_API_KEY}`) {
        return res.status(401).json({ success: false });
      }
    
      const data = req.body;
    
      // 2. Chống trùng: UNIQUE(transaction_id) + INSERT IGNORE (race-safe)
      const [log] = await db.execute(
        'INSERT IGNORE INTO webhook_logs (transaction_id, body) VALUES (?, ?)',
        [data.id, JSON.stringify(data)],
      );
      if (log.affectedRows === 0) {
        return res.json({ success: true }); // đã xử lý trước đó
      }
    
      // 3. UPDATE atomic: chỉ đổi pending → paid nếu tiền đủ
      if (data.transferType === 'in' && data.code) {
        await db.execute(
          `UPDATE orders SET status = ?, paid_at = NOW()
           WHERE code = ? AND status = ? AND amount <= ?`,
          ['paid', data.code, 'pending', data.transferAmount],
        );
    
        // TODO: enqueue email / cập nhật kho
      }
    
      res.json({ success: true });
    });
    
    app.listen(3000);
    ```
  </Code>
</CodeTabs>

<Callout type="tip" title="UPDATE atomic thay cho SELECT-then-UPDATE">
`UPDATE ... WHERE status = 'pending' AND amount <= ?`
 chạy trong một câu lệnh, không cần transaction. Nếu 2 webhook đến cùng lúc (retry), chỉ lần đầu đổi được 
`pending → paid`
, lần sau điều kiện 
`status = 'pending'`
 không còn khớp nên không làm gì. Đảm bảo không cộng tiền/gửi email 2 lần.
</Callout>

## Database schema

```sql
CREATE TABLE orders (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã thanh toán (nội dung CK)',
    amount      BIGINT      NOT NULL COMMENT 'Số tiền VND',
    status      ENUM('pending', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
    paid_at     DATETIME,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE webhook_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id  BIGINT NOT NULL UNIQUE COMMENT 'ID giao dịch SePay',
    body            JSON   NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Vì sao chọn kiểu này:**

* `amount BIGINT`: VND không có phần thập phân. `INT` max 2.1 tỷ, hoá đơn B2B dễ tràn.
* `code UNIQUE`: chặn trùng mã thanh toán ở tầng DB.
* `transaction_id UNIQUE`: khoá chống trùng webhook. Cùng với `INSERT IGNORE` trong handler, không cần lock.
* `body JSON`: query được theo field với `JSON_EXTRACT` khi debug.
* `idx_status_created (status, created_at)`: query "đơn pending cũ hơn X phút để expire".

## Checklist production

<Callout type="warn" title="Bảo mật mã thanh toán">
Mã thanh toán phải 
khó đoán
. Dùng 
`bin2hex(random_bytes(6))`
 (PHP) hoặc 
`crypto.randomBytes(6).toString('hex')`
 (Node). 
Không
 dùng số tăng dần hoặc timestamp đơn thuần, kẻ xấu đoán được mã có thể gửi webhook giả hoặc claim đơn người khác.
</Callout>

<Callout type="warn" title="Validate số tiền ở SQL, không ở code">
Đặt 
`amount <= ?`
 trong 
`WHERE`
 của câu UPDATE. Check ở PHP/Node có thể bị race: hai webhook cùng lúc, cả hai đều thấy 
`status='pending'`
, cả hai đều update.
</Callout>

<Callout type="warn" title="Bật HMAC-SHA256 khi production">
API Key chỉ xác minh request đến từ SePay, nhưng không bảo vệ payload nếu có ai chen ngang sửa đổi giữa đường truyền. Chuyển sang 
HMAC-SHA256
 khi lên prod.
</Callout>

<Callout type="info" title="Trả 200 trước, xử lý nặng sau">
Webhook có timeout 30 giây. Gửi email, cập nhật kho, gọi API bên thứ ba: đẩy vào queue (Redis, SQS, rabbitmq) rồi trả 
`{"success": true}`
 ngay.
</Callout>

## Tiếp theo

* [Tạo và nhúng QR Code](/vi/tien-ich-khac/tao-qr-code): tham số QR đầy đủ, danh sách ngân hàng
* [Tạo webhook](./tao-webhook): form 4 bước, bộ lọc, retry, xác thực
* [Xác thực](./xac-thuc): HMAC-SHA256 cho production
* [Đối soát giao dịch](./doi-soat-giao-dich): backup khi webhook mất