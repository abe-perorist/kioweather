import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー — きおてん",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← トップへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">プライバシーポリシー</h1>
        <p className="text-xs text-gray-400 mb-8">最終更新日：2026年4月10日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-800 mb-2">1. 収集する情報</h2>
            <p>本サービスは以下の情報を収集します。</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><span className="font-medium">位置情報</span>：ブラウザのGeolocation APIを通じて取得します。気象データの取得のみに使用し、サーバーには保存しません。</li>
              <li><span className="font-medium">利用時間帯の設定</span>：朝・夜の外出時間はお使いの端末のlocalStorageにのみ保存されます。</li>
              <li><span className="font-medium">アクセス情報</span>：Google Analyticsにより、ページビューや端末情報等が収集されます。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">2. 情報の利用目的</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>現在地周辺の気象データを取得し、気温比較情報を提供するため</li>
              <li>サービスの利用状況を分析し、改善するため</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">3. 第三者への提供</h2>
            <p>本サービスは以下の第三者サービスを利用しています。</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><span className="font-medium">Open-Meteo</span>（気象データの取得）：位置情報（緯度・経度）を送信します。</li>
              <li><span className="font-medium">Google Analytics</span>（アクセス解析）：Googleのプライバシーポリシーに基づき情報が収集されます。</li>
            </ul>
            <p className="mt-2">上記以外に、個人を特定できる情報を第三者に提供することはありません。</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">4. Google Analyticsについて</h2>
            <p>本サービスはGoogle Analyticsを使用しています。Google Analyticsはクッキーを使用してデータを収集します。収集されるデータはGoogleのプライバシーポリシーに従って管理されます。Google Analyticsの無効化はブラウザのアドオン設定から行えます。</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">5. お問い合わせ</h2>
            <p>本ポリシーに関するご質問は、GitHubリポジトリのIssueよりお寄せください。</p>
          </section>
        </div>
      </div>
    </main>
  );
}
