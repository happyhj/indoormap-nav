import ObjMtlLoader from "obj-mtl-loader";

const objMtlLoader = new ObjMtlLoader();

export default class Object3DLoader {
	static loadItems(resources) {
        return Promise.all(
            resources.map((resource => Object3DLoader.loadItem(resource)))
        );
    }
	static loadItem(resource) {
        console.log("loadItem", resource);
        return new Promise((res, rej) => {
            var objUrl = `${resource}.obj`;
            var mtlUrl = `${resource}.mtl`;
            var request = new XMLHttpRequest();
            request.open( 'GET', mtlUrl, true );
            request.addEventListener( 'load', function ( event ) {
                var loader = new THREE.MTLLoader();
                    loader.setCrossOrigin( true );
                    loader.setTexturePath( objUrl );
                    loader.load( mtlUrl, function ( materials ) {
                        var loader = new THREE.OBJLoader();
                        loader.setMaterials( materials );
                        loader.load( objUrl, function ( object ) {
                            console.log("loadItem: loaded", objUrl);
                            res(object);
                        });
                    } );
            } );
            request.send( null );
        });
    }
}
