# ShussekiBot

VC参加者のユーザー名・滞在時間の記録と報告を行うDiscord Bot

## 環境

* Node.js v20.18.0

## セットアップ

### パッケージインストール

```
npm i
```

## npmスクリプト

※ `docker compose up -d --build`はprod環境用の設定のため使用せず、以下のコマンドから起動すること

### ローカル実行

```
npm run dev-local
```

### dev docker環境実行

```
npm run dev-docker
```

### dev docker環境実行(bindマウント)

/.dev/db がDBとしてマウントされる

```
npm run dev-docker:bind
```

## メモ

koyebの無料インスタンスがvolumeに対応していないので、再デプロイ時にデータを残すための暫定手順。  
botに対してメンションで以下を送信すると、現在のdb.jsonの内容がログチャンネルに出力される。

```
@botname db.getAllData()
```

それを新しく切ったブランチにコピペしてコミット、そのブランチをデプロイ後、ブランチを削除する。
