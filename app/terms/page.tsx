import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 — きおてん",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← トップへ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">利用規約</h1>
        <p className="text-xs text-gray-400 mb-8">最終更新日：2026年4月10日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第1条（適用）</h2>
            <p>本規約は、きおてん（以下「本サービス」）の利用に関する条件を定めるものです。本サービスを利用することで、本規約に同意したものとみなします。</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第2条（サービスの内容）</h2>
            <p>本サービスは、ユーザーの現在地周辺の気温情報を取得し、今日と昨日の気温を比較することで、服装の参考情報を提供するWebアプリケーションです。</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第3条（免責事項）</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>気象データは外部APIより取得しており、正確性・完全性を保証するものではありません。</li>
              <li>本サービスの情報に基づく服装の選択や行動に関して、運営者は一切の責任を負いません。</li>
              <li>システムの停止・障害・データの消失等による損害について、運営者は責任を負いません。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第4条（禁止事項）</h2>
            <p>以下の行為を禁止します。</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>本サービスへの不正アクセスや過度な負荷をかける行為</li>
              <li>本サービスを通じた違法行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第5条（サービスの変更・終了）</h2>
            <p>運営者は、事前の通知なく本サービスの内容を変更または終了する場合があります。</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第6条（準拠法）</h2>
            <p>本規約は日本法に準拠し、解釈されるものとします。</p>
          </section>
        </div>
      </div>
    </main>
  );
}
