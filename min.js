/**
 * Created by Administrator on 2015-10-19.
 */
/*
 var Command, Invoker;

 Command = function(order, param){
 this.order = order;
 this.param = param;

 };

 Command.prototype.run = function(gl){
 gl[this.order].apply(gl, this.param);
 };

 Invoker = function(){
 this.orders=[];
 };

 Invoker.prototype.add = function(cmd){
 this.order.push(cmd);
 };

 Invoker.prototype.run=function(gl){
 for(var i = 0, len=this.order.length; i < len; i++){
 this.order[i].run(gl);
 }
 };

 var invoker = new Invoker();
 invoker.add(new Command('clearColor', [0,0,0,1]));
 invoker.add(new Command('clearColor', [0,0,0,1]));
 invoker.add(new Command('clearColor', [0,0,0,1]));
 invoker.run(gl);


 canvas.addEventListener('webglcontextrestored',function(){
 world.gl = cv.getContext("webgl");
 invoker.run(world.gl);
 });
 */

// ---------- lib star ---------------------

var World = function(canvas){
    var gl = this.gl = canvas.getContext("webgl");
    this.meshes = [];
    this.changed = {
        "vertex" : true,
        "position" : true,
        "scale" : true,
        "rotate" : true,
        "color" : true,
        "viewport" : true
    }

    var vertexShaderSource =    "" +
        "attribute vec3 aVertexPosition;\n" +
        "attribute vec3 aPosition;\n" +
        "attribute vec3 aScale;\n" +
        "attribute vec3 aRotation;\n" +
        "attribute vec3 aColor;\n" +
        "varying vec3 vColor;\n" +
        "" +
        "mat4 positionMTX(vec3 p){\n" +
        "   return mat4(1,0,0,0,  0,1,0,0,  0,0,1,0,  p[0],p[1],p[2],1);\n" +
        "}\n" +
        "mat4 scaleMTX(vec3 sc){\n" +
        "   return mat4(sc[0],0,0,0,  0,sc[1],0,0,  0,0,sc[2],0,  0,0,0,1);\n" +
        "}\n" +
        "mat4 rotationMTX(vec3 r){\n" +
        "   float s, c;\n" +
        "   s = sin(r[0]), c = cos(r[0]);\n" +
        "   mat4 mx = mat4(1,0,0,0,  0,c,-s,0,  0,s,c,0,  0,0,0,1);\n" +
        "   s = sin(r[1]), c = cos(r[1]);\n" +
        "   mat4 my = mat4(c,0,-s,0,  0,1,0,0,  s,0,c,0,  0,0,0,1);\n" +
        "   s = sin(r[2]), c = cos(r[2]);\n" +
        "   mat4 mz = mat4(c,-s,0,0,  s,c,0,0,  0,0,1,0,  0,0,0,1);\n" +
        "   return mx*my*mz;\n" +
        "}\n" +
        "" +
        "void main(void){\n" +
        "   vColor = aColor;\n" +
            // "   gl_Position = vec4(aVertexPosition, 1.0);\n" +
            // "   gl_Position = positionMTX(aPosition)*scaleMTX(aScale)*vec4(aVertexPosition, 1.0);\n" +
        "   gl_Position = positionMTX(aPosition)*rotationMTX(aRotation)*scaleMTX(aScale)*vec4(aVertexPosition, 1.0);\n" +
        "   gl_PointSize = 2.0;\n" +
        "" +
        "}";

    var fragmentShaderSource =  "" +
        "precision lowp float;\n" +
        "varying vec3 vColor;\n" +
        "void main(void){\n" +
        "" +
        "   gl_FragColor = vec4(vColor, 1);\n" +
            // "   gl_FragColor = vec4(1, 0, 0, 1);\n" +
//                "   gl_FragColor.a = 0.5;\n" +
        "" +
        "}\n";

//        this.invoker.add(new Command('createShader', gl.VERTEX_SHADER));
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    var program = this.program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.aVertexPosition);
    program.aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(program.aPosition);
    program.aScale = gl.getAttribLocation(program, "aScale");
    gl.enableVertexAttribArray(program.aScale);
    program.aRotation = gl.getAttribLocation(program, "aRotation");
    gl.enableVertexAttribArray(program.aRotation);
    program.aColor = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(program.aColor);


//        this.invoker = new Invoker();
};

World.prototype.viewport = function(width, height){
    this.view = {"w" : width, "h" : height};
//        this.invoker.add(new Command('viewport', [0, 0, width, height]));
    this.notifyChangeData("viewport");
};

World.prototype.frustum = function(){

};

World.prototype.add = function(mesh){
//        if(!this.meshes[mesh.material.type])
//            this.meshes[mesh.material.type] = {};
//
//        this.meshes[mesh.material.type][mesh] = mesh;

    mesh.owner = this;
    this.meshes.push(mesh);
};

World.prototype.notifyChangeData = function(propertyName){
    this.changed[propertyName] = true;
};

World.prototype.render = function(){
    var gl = this.gl;
    var program = this.program;
    var mesh, i, j, len, len2, totalCount = 0;

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(this.changed.viewport){
        gl.viewport(0, 0, this.view.w, this.view.h);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
    }

    if(this.changed.vertex){
        this.vertex_data = [];
        this.index_data = [];
        this.position_data = [];
        this.scale_data = [];
        this.rotation_data = [];
        this.color_data = [];
        for(i = 0, len = this.meshes.length; i < len; i++) {
            mesh = this.meshes[i];
            var len3 = this.vertex_data.length / 3;
            this.vertex_data = this.vertex_data.concat(mesh.geometry.vertices);
            for(j = 0, len2 = mesh.geometry.indices.length; j < len2; j++) {
                this.index_data.push(mesh.geometry.indices[j] + len3);
            }

            for(j = 0, len2 = mesh.geometry.vertices.length/3; j < len2; j++){
                this.position_data.push(mesh.px, mesh.py, mesh.pz);
                this.scale_data.push(mesh.sx, mesh.sy, mesh.sz);
                this.rotation_data.push(mesh.rx, mesh.ry, mesh.rz);
                this.color_data.push(mesh.r, mesh.g, mesh.b);
            }
            totalCount += len2;
        }
        this.vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

        this.indexBuffer = gl.createBuffer(gl.ELEMENT_ARRAY_BUFFER);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.index_data), gl.STATIC_DRAW);

        this.positionBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.position_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.aPosition, 3, gl.FLOAT, false, 0, 0);

        this.scaleBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.scale_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.aScale, 3, gl.FLOAT, false, 0, 0);

        this.colorBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.color_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.aColor, 3, gl.FLOAT, false, 0, 0);

        this.roatationBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.roatationBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.rotation_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.aRotation, 3, gl.FLOAT, false, 0, 0);

    }else{
        if(this.changed.position) {
            this.position_data = [];
            for (i = 0, len = this.meshes.length; i < len; i++){
                mesh = this.meshes[i];
                for (j = 0, len2 = mesh.geometry.vertices.length/3; j < len2; j++) {
                    this.position_data.push(mesh.px, mesh.py, mesh.pz);
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.position_data), gl.STATIC_DRAW);
        }
        if(this.changed.scale) {
            this.scale_data = [];
            for (i = 0, len = this.meshes.length; i < len;  i++){
                mesh = this.meshes[i];
                for (j = 0, len2 = mesh.geometry.vertices.length/3; j < len2; j++) {
                    this.scale_data.push(mesh.sx, mesh.sy, mesh.sz);
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.scale_data), gl.STATIC_DRAW);
        }
        if(this.changed.color) {
            this.color_data = [];
            for (i = 0, len = this.meshes.length; i < len; i++) {
                mesh = this.meshes[i];
                for (j = 0, len2 = mesh.geometry.vertices.length/3; j < len2; j++) {
                    this.color_data.push(mesh.r, mesh.g, mesh.b);
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.color_data), gl.STATIC_DRAW);
        }

        if(this.changed.rotate) {
            this.rotation_data = [];
            for (i = 0, len = this.meshes.length; i < len; i++) {
                mesh = this.meshes[i];
                for (j = 0, len2 = mesh.geometry.vertices.length/3; j < len2; j++) {
                    this.rotation_data.push(mesh.rx, mesh.ry, mesh.rz);
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.roatationBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.rotation_data), gl.STATIC_DRAW);
        }
    }

    this.changed = {
        "vertex" : false,
        "position" : false,
        "scale" : false,
        "rotate" : false,
        "color" : false,
        "viewport" : false
    }
    gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_SHORT, 0);
};

var Geometry = function(vertices, indices){
    this.vertices = vertices;
    this.indices = indices;
};

var Material = function(color, imgurl){
    this.color = color;
    if(imgurl){
        var img = new Image();
        var pthis = this;
        img.onload = function(evt){
            pthis.img = this;
        };
        img.src = "";
    }
};

Material.prototype.setType = function(type){
    this.type = type;
};

var Mesh = function(geometry, material){
    this.geometry = geometry;
    this.material = material;
    this.px = 0;
    this.py = 0;
    this.pz = 0;
    this.rx = 0;
    this.ry = 0;
    this.rz = 0;
    this.sx = 1;
    this.sy = 1;
    this.sz = 1;
    if(typeof material.color == "string"){
        this.r = parseInt(material.color.substr(1,2), 16)/255;
        this.g = parseInt(material.color.substr(3,2), 16)/255;
        this.b = parseInt(material.color.substr(5,2), 16)/255;
    }else if(material.color instanceof Array){
        this.r = material.color[0];
        this.g = material.color[1];
        this.b = material.color[2];
    }
    this.owner = null;
};

Mesh.prototype.setType = function(type){
    this.type = type;
};

Mesh.prototype.translate = function(px, py, pz){
    this.px = px;
    this.py = py;
    this.pz = pz;
    if(this.owner){
        this.owner.notifyChangeData("position");
    }
};

Mesh.prototype.rotate = function(rx, ry, rz){
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
    if(this.owner){
        this.owner.notifyChangeData("rotate");
    }
};

Mesh.prototype.scale = function(sx, sy, sz){
    this.sx = sx;
    this.sy = sy;
    this.sz = sz;
    if(this.owner){
        this.owner.notifyChangeData("scale");
    }
};

// -------------------- lib end --------------------------------
