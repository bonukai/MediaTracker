export class CancellationToken {
    private _shouldCancel = false;
    private resolve: (value: void) => void;

    public async cancel() {
        this._shouldCancel = true;

        return new Promise<void>((resolve) => {
            this.resolve = resolve;
        });
    }

    public get shouldCancel() {
        return this._shouldCancel;
    }

    public complected() {
        this.resolve && this.resolve();
    }
}
