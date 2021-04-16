export default class TreeElement{
    constructor(name, type, id, object) {
        this.name =name;
        this.type = type;
        this.id = id;
        this.object = object;
        this.children = [];
    }
}