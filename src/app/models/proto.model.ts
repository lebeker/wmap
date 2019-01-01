export abstract class Model {
    constructor(data?: any) {
        if (data)
            this.populate(data);
    }

    populate(data: any) {
        for (let a of Object.getOwnPropertyNames(data))
            if (typeof data[a] == "function") {
                this[a] = (...args) => {
                    return data[a].call(this, ...args);
                };
            } else
                this[a] = data[a];
        return this;
    }

    get list(): any {
        let res: any = {};
        for (let p of Object.getOwnPropertyNames(this))
            res[p] = (<any>this)[p];
        return res;
    }
}
