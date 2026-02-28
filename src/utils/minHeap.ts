type HeapNode = {
    ip : string ;
    expiry: number;
}

export class MinHeap {
    private heap: HeapNode[] = [];

    private getParent(i: number){
        return Math.floor((i-1)/2);
    }

    private getLeft(i: number){
        return 2* i + 1;
    }

    private getRight(i: number){
        return 2* i +2;
    }

    private swap(i: number, j: number) {
        [this.heap[i]!, this.heap[j]!] = [this.heap[j]!, this.heap[i]!];
    }

    insert(node: HeapNode){
        this.heap.push(node);
        this.heapifyUp();
    }

    peek(): HeapNode | undefined {
        return this.heap[0];
    }

    removeMin() : HeapNode | undefined {
        if (this.heap.length === 0 ) return;

        const root = this.heap[0];
        const last = this.heap.pop()!;

        if(this.heap.length > 0){
            this.heap[0] = last;
            this.heapifyDown();
        }
        return root;
    }

    private heapifyUp(){
        let i = this.heap.length -1;

        while (i >0){
            const p = this.getParent(i);

            if(this.heap[p]!.expiry <= this.heap[i]!.expiry) break;
            
            this.swap(p , i);

            i = p;
        }
    }

    private heapifyDown() {
    let i = 0;

    while (true) {
      let smallest = i;
      const left = this.getLeft(i);
      const right = this.getRight(i);

      if (
        left < this.heap.length &&
        this.heap[left]!.expiry < this.heap[smallest]!.expiry
      ) {
        smallest = left;
      }

      if (
        right < this.heap.length &&
        this.heap[right]!.expiry < this.heap[smallest]!.expiry
      ) {
        smallest = right;
      }

      if (smallest === i) break;

      this.swap(i, smallest);
      i = smallest;
    }
  }
}