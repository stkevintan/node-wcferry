import { Wcferry, WcferryOptions } from '@wcferry/core';
import debug from 'debug';
import ws from 'ws';

const logger = debug('wcferry:ws');

export interface IncomingMessage {
    id: string;
    method: string;
    params?: unknown[];
}

type CallableMethod<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
const AllowedBuiltinMethods: Array<CallableMethod<Wcferry>> = [
    'acceptNewFriend',
    'addChatRoomMembers',
    'dbSqlQuery',
    'decryptImage',
    'delChatRoomMembers',
    'downloadAttach',
    'downloadImage',
    'forwardMsg',
    'getAliasInChatRoom',
    'getAudioMsg',
    'getChatRoomMembers',
    'getChatRooms',
    'getContact',
    'getContacts',
    'getDbNames',
    'getFriends',
    'getMsgTypes',
    'getOCRResult',
    'getSelfWxid',
    'getUserInfo',
    'inviteChatroomMembers',
    'isLogin',
    'receiveTransfer',
    'refreshPyq',
    'revokeMsg',
    'sendFile',
    'sendImage',
    'sendPat',
    'sendRichText',
    'sendTxt',
];

export class WcfWSServer {
    private wss: ws.WebSocketServer;
    constructor(private wcferry: Wcferry, options?: ws.ServerOptions) {
        this.wss = new ws.WebSocketServer({
            port: 8080,
            ...options,
        });
        this.listen();
    }

    static start(options?: { wcferry: WcferryOptions; ws: ws.ServerOptions }) {
        const wcferry = new Wcferry(options?.wcferry);
        wcferry.start();
        return new WcfWSServer(wcferry, options?.ws);
    }

    private off?: () => void;

    private listen() {
        this.wss.on('connection', (ws) => {
            ws.on('error', (err) => {
                console.log(err);
            });
            ws.on('message', async (data) => {
                const req = this.parseReq(data.toString('utf8'));
                if (req) {
                    logger(
                        '-> recv %s [%s]: %o',
                        req.id,
                        req.method,
                        req.params
                    );
                    if (AllowedBuiltinMethods.some((m) => m === req.method)) {
                        const ret = await this.executeCommand(
                            req.method as CallableMethod<Wcferry>,
                            req.params
                        );
                        this.send(ws, req.id, ret);
                    }
                    switch (req.method) {
                        case 'recvPyq':
                            this.wcferry.recvPyq = !!req.params?.[0];
                            this.send(ws, req.id, { result: true });
                            return;
                        case 'message.enable':
                            try {
                                this.off ??= this.wcferry.on((msg) => {
                                    logger('<- msg %o', msg.raw);
                                    ws.send(
                                        JSON.stringify({
                                            type: 'message',
                                            data: msg.raw,
                                        })
                                    );
                                });
                                this.send(ws, req.id, { result: true });
                            } catch (err) {
                                this.send(ws, req.id, {
                                    error: {
                                        message: this.formatError(err),
                                        code: -2,
                                    },
                                });
                            }
                            return;
                        case 'message.disable':
                            try {
                                this.off?.();
                                this.send(ws, req.id, { result: true });
                            } catch (err) {
                                this.send(ws, req.id, {
                                    error: {
                                        message: this.formatError(err),
                                        code: -2,
                                    },
                                });
                            }
                    }
                }
            });
        });
    }

    send(
        ws: ws.WebSocket,
        id: string,
        payload:
            | { result: unknown }
            | { error: { message: string; code?: number } }
    ) {
        const resp = {
            id,
            ...payload,
        };
        logger('<- resp %s %o', id, payload);
        ws.send(JSON.stringify(resp));
    }

    private async executeCommand(
        method: CallableMethod<Wcferry>,
        params: unknown[] = []
    ) {
        try {
            // eslint-disable-next-line prefer-spread
            const ret = await (
                this.wcferry[method] as (...args: unknown[]) => unknown
            )(...params);
            return { result: ret };
        } catch (err) {
            return {
                error: {
                    message: `Execute ${method} failed: ${this.formatError(
                        err
                    )}`,
                    code: -1,
                },
            };
        }
    }

    private formatError(err: unknown) {
        return err instanceof Error ? err.message : `${err}`;
    }

    private parseReq(data: string): IncomingMessage | undefined {
        try {
            const json = JSON.parse(data);
            if (
                typeof json.id === 'number' &&
                typeof json.method === 'string'
            ) {
                return json as IncomingMessage;
            }
            return undefined;
        } catch {
            return undefined;
        }
    }

    close() {
        this.wss.close();
    }
}
