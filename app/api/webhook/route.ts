import { NextRequest, NextResponse } from 'next/server';

// 外部Webhookの設定
const EXTERNAL_WEBHOOK_URL = 'https://sumptuous-goat-9c0.notion.site/24905a6b650b80d68bb7fb5c582c67a5?v=24905a6b650b80f6b9f9000c24bcb403';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Discord Webhookの処理
    if (body.type === 'DISCORD_WEBHOOK') {
      // 外部Webhookにデータを転送
      try {
        const response = await fetch(EXTERNAL_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'discord-bot',
            timestamp: new Date().toISOString(),
            data: body,
            type: 'DISCORD_WEBHOOK_FORWARD'
          }),
        });

        if (response.ok) {
          console.log('✅ Webhookが外部サーバーに正常に転送されました');
          return NextResponse.json({ 
            status: 'webhook処理完了、外部転送成功',
            external_status: 'success'
          });
        } else {
          console.error('❌ 外部サーバーへのWebhook転送に失敗しました:', response.status);
          return NextResponse.json({ 
            status: 'webhook処理完了、外部転送失敗',
            external_status: 'failed',
            error: response.statusText
          }, { status: 500 });
        }
      } catch (forwardError) {
        console.error('❌ Webhook転送中にエラーが発生しました:', forwardError);
        return NextResponse.json({ 
          status: 'webhook処理完了、外部転送エラー',
          external_status: 'error',
          error: forwardError instanceof Error ? forwardError.message : '不明なエラー'
        }, { status: 500 });
      }
    }

    // 外部Webhookからの直接呼び出しも処理
    if (body.type === 'EXTERNAL_WEBHOOK') {
      console.log('📥 外部Webhookを受信しました:', body);
      return NextResponse.json({ 
        status: '外部Webhook受信完了',
        processed: true
      });
    }

    return NextResponse.json(
      { error: '無効なWebhookタイプです' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Webhook処理中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// GETメソッドでWebhookの状態確認
export async function GET() {
  return NextResponse.json({
    status: 'webhookエンドポイント稼働中',
    external_webhook_url: EXTERNAL_WEBHOOK_URL,
    timestamp: new Date().toISOString()
  });
}
