一、整体方案（全部免费）
架构（极简但可用）
前端托管：Vercel（免费）
数据获取：公开 API / RSS（免费）
自动更新：Vercel Serverless / Cron（免费额度）
域名：你已有 bookshire.net
CDN / HTTPS：Cloudflare（免费）

👉 不需要服务器、不需要数据库

二、功能拆解（你的需求）

你要：

展示：
最新出版书（中 + 英）
销量 Top 10
每天自动更新
页面美观
三、数据来源（关键）

免费可用：

英文书
Google Books API
中文书（推荐组合）
豆瓣读书（非官方，需抓取）
或：
Open Library
京东榜单（简单爬）

👉 MVP建议：
先用 Google Books + Open Library（稳定合法）

四、项目结构（超简单）
bookshire-site/
├── pages/
│   ├── index.tsx
│   └── api/
│       └── books.ts
├── components/
│   └── BookCard.tsx
├── styles/
└── package.json
五、核心代码（可直接用）
1️⃣ API（获取数据）

/pages/api/books.ts

export default async function handler(req, res) {
  try {
    const latestRes = await fetch(
      "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=newest&maxResults=10"
    );

    const latest = await latestRes.json();

    const trendingRes = await fetch(
      "https://www.googleapis.com/books/v1/volumes?q=bestseller&maxResults=10"
    );

    const trending = await trendingRes.json();

    res.status(200).json({
      latest: latest.items,
      trending: trending.items,
    });
  } catch (e) {
    res.status(500).json({ error: "failed" });
  }
}
2️⃣ 页面 UI（漂亮 + 简洁）

/pages/index.tsx

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>📚 BookShire</h1>

      <Section title="🔥 Top Selling Books" books={data.trending} />
      <Section title="🆕 Latest Releases" books={data.latest} />
    </div>
  );
}

function Section({ title, books }) {
  return (
    <div style={{ marginTop: 40 }}>
      <h2>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
        {books.map((b, i) => (
          <BookCard key={i} book={b} />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book }) {
  const info = book.volumeInfo;

  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 10,
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
    }}>
      <img
        src={info.imageLinks?.thumbnail}
        style={{ width: "100%", borderRadius: 8 }}
      />
      <h4>{info.title}</h4>
      <p style={{ fontSize: 12 }}>{info.authors?.join(", ")}</p>
    </div>
  );
}
六、自动更新（关键）

你有两种方式：

方案 A（最简单）

👉 每次访问自动 fetch（已经实现）

✔ 不需要 cron
❌ 每次请求 API（但免费够用）

方案 B（更高级）

用 Vercel ISR：

export async function getStaticProps() {
  const res = await fetch("your-api");
  const data = await res.json();

  return {
    props: { data },
    revalidate: 86400, // 每天更新
  };
}

👉 每天自动更新一次

当前项目已实现：

- 首页 `getStaticProps` 使用 `revalidate: 86400`
- `pages/api/revalidate.ts` 提供受保护的按需刷新接口
- `vercel.json` 配置了每天 1 次的 Vercel Cron

部署时需要在 Vercel 项目里添加环境变量：

- `CRON_SECRET`：至少 16 位的随机字符串

说明：

- `vercel.json` 当前使用 `0 12 * * *`
- 这是 UTC 时间，也就是每天 `12:00 UTC`
- 按 2026-04-25 的 America/Chicago 时区来看，对应 `2026-04-25 07:00 CDT`
- 到冬令时会变成 `06:00 CST`

Cron 会访问：

- `/api/revalidate`

这个接口会校验 `Authorization: Bearer <CRON_SECRET>`，然后执行首页 `/` 的 ISR 重新生成。

七、部署（10分钟完成）
步骤：
注册 GitHub
push 代码
去 Vercel
Import repo

绑定你的域名：

bookshire.net
八、UI 提升建议（让它“看起来像产品”）

你可以加：

深色模式
卡片 hover 动画
分类标签（fiction / tech）
搜索框（下一步）
九、你现在得到的东西

这个 MVP：

✔ 完全免费
✔ 自动更新
✔ 有真实数据
✔ 可绑定域名
✔ 可直接上线
十、下一步升级（如果你想更强）

当你准备进阶：

加中文数据源（豆瓣 / 京东）
加用户系统（Supabase）
加收藏 / 推荐
接你之前的 backend
