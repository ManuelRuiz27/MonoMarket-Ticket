declare module 'openpay' {
    type OpenpayCallback = (error: unknown, response: unknown) => void;

    export default class Openpay {
        constructor(merchantId: string, privateKey: string, isProduction?: boolean);
        charges: {
            create(payload: unknown, callback: OpenpayCallback): void;
        };
    }
}
