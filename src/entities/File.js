import Utils from '@/utils/Utils';

const fs = require('fs');

export default class File{
    constructor(path, name, type, isDirectory) {
        this.path = path;
        this.name = name;      //always fullname
        this.type = type;
        this.isDirectory = isDirectory;
        this.children = [];
    }

    static getFileName(path) {
        const splitted = path.toString().split(Utils.getDir());
        if(splitted.length >= 1){
            return splitted[splitted.length-1];
        }
        return ''
    }
    static isDirectory(path){
        return fs.statSync(path)
                 .isDirectory();
    }
    static getFileType(name){
        const splitted = name.toString().split('.');
        if(splitted.length > 1){
            return splitted[splitted.length-1];
        }
        return ''
    }
}