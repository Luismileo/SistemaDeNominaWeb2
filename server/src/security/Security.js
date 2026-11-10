let security = class Security{
    constructor(){
        this.permissionMethodMap = new Map();
        this.permissionOptionMap = new Map();
        this.classMap = new Map();
    }

    loadPermissionMethod(){

    }

    loadPermissionOption(){

    }

    getPermissionMethod(jData){

    }

    getPermissionOption(jData){

    }

    setPermissionMethod(jData){

    }

    setPermissionOption(){

    }

    getKet(jData){
        return jData.subsystem+"_"+jData.className+"_"+jData.methodName+"_"+jData.profile;
    }

    async executeMethod(jData){
        //reflexion para ejecutar los metodos
        if(this.classMap.has(this.getKey(jData))){
            let theClass = this.classMap.get(this.getKey(jData));
            //hacer la instancia y ejecutar
        }
        else{
            //hacer un import()
            let theClass = await import("./" + jData.className + ".js");
            this.classMap.set(this.getKey(jData), theClass);
            //hacer la instancia y ejecutar
        }
    }
}