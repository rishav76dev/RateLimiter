export class TimeBucket {

    private readonly now: number

    constructor(public readonly windowSize: number, currentTime?: number){
        this.now = currentTime ?? Math.floor(Date.now() /1000);

        if (windowSize <= 0){
            throw new Error ("windowSize must be greater than 0");
        }
    }

    get currentWindowId(): number {
        return Math.floor(this.now /this.windowSize);
    }

    get previousWindowId(): number {
        return this.currentWindowId -1;
    }

    get elapsedTime(): number {
        return this.now % this.windowSize;
    }

    get overlapRatio(): number {
        return (this.windowSize - this.elapsedTime) / this.windowSize;
    }

    static create(windowSize: number): TimeBucket {
        return new TimeBucket(windowSize);
    }

}