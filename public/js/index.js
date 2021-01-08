// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCk_aoscgy9uwGQJ3OfEcBulfttjH2Mzxw",
    authDomain: "carol-56175.firebaseapp.com",
    databaseURL: "https://carol-56175.firebaseio.com",
    projectId: "carol-56175",
    storageBucket: "carol-56175.appspot.com",
    messagingSenderId: "497363212618",
    appId: "1:497363212618:web:39701f8718c372bcbc09b3",
    measurementId: "G-9TE9525H3C"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var viewer;
var viewer1;

function showViewer() {


    var options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2', // TODO: for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: getForgeToken
    };

    Autodesk.Viewing.Initializer(options, function() {

        var tipo = document.querySelector('[aria-selected="true"]').textContent;
        console.log('tipo: ', tipo)
        if (tipo == "Tempo Real") {

            viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), {
                extensions: ['PanelInfoViewerExtension', 'ManutencaoViewerExtension']
            });
            viewer.start();

            var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d2djaWloemhodW11Z2J6Z29jc2dhaXZ0ZWpjbXZldHotc25yL1NOUl9IQUJfRklYXzAyXzIwMTlfUjEucnZ0';

            //var documentId = 'urn:' + urn;
            Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
        } else {

            viewer1 = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer1'), {
                extensions: ['PanelInfoViewerExtension']
            });
            viewer1.start();
            var documentId1 = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d2djaWloemhodW11Z2J6Z29jc2dhaXZ0ZWpjbXZldHotc25yL1NOUl9IQUJfRklYXzAyXzIwMTlfUjEucnZ0';

            Autodesk.Viewing.Document.load(documentId1, onDocumentLoadSuccess1, onDocumentLoadFailure1);
        }







    });

    function onDocumentLoadSuccess1(doc) {
        //console.log("Passou por sucesso 1")
        // if a viewableId was specified, load that view, otherwise the default view
        var viewables1 = doc.getRoot().getDefaultGeometry();
        viewer1.loadDocumentNode(doc, viewables1).then(i => {
            // any additional action here?
            console.log("Passou por sucesso 1")
        });
    }

    function onDocumentLoadFailure1(viewerErrorCode) {
        console.log("Passou por falha 1")
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }


    /* function onDocumentLoadSuccessInteiro(doc) {
        var viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables).then(i => {})
    } */

    function onDocumentLoadSuccess(doc) {
        var viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables).then(i => {
            // documented loaded, any action?

            var obra = document.getElementById('obras').value;
            var bloco = document.getElementById('bloco').value;
            var vetorBlocos = []
            firebase.database().ref('obras/' + obra + '/sequenciareal/' + bloco).once('value').then(snapshot => {
                var todosBlocos = (Object.keys(snapshot.val()));
                todosBlocos.forEach(value => {
                    // snapshot.val()[value].status
                    vetorBlocos.push({
                        bloco: value,
                        status: snapshot.val()[value].status
                    })
                })
                var vetorTodosElementos = []
                getAllLeafComponents(viewer, (dbIds) => {
                    //Propriedade que quero buscar das elemetos dos setores e formas
                    const filteredProps = ['Numeração', "Agrupamento"];
                    // Get only the properties we need for the leaf dbIds
                    this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                        // Iterate through the elements we found
                        items.forEach((item) => {
                            // and iterate through each propertys
                            item.properties.forEach(function(prop) {
                                vetorTodosElementos.push(item);
                            });
                        });
                        //Removendo elementos duplicados
                        var elementos = [...new Set(vetorTodosElementos)];

                        var isolated = []
                        var aux = 0;
                        for (i = vetorBlocos.length - 1; i >= 0; i--) {
                            //Identifica o primeiro pavimento com forma
                            if (vetorBlocos[i].status == 1 && aux == 0) {
                                elementos.forEach(value => {
                                    //console.log("valur: ", value)

                                    var pVetorBlocos = vetorBlocos[i].bloco.replace(/\s/g, '');
                                    //console.log('pVetorBlocos: ',pVetorBlocos)


                                    if ('0' + value.properties[1].displayValue == pVetorBlocos ||
                                        value.properties[1].displayValue == 0) {
                                        //console.log('value: ',value)

                                        //console.log(`value.properties[1].displayValue= ${value.properties[1].displayValue}   vetorBlocos[i].bloco:  ${vetorBlocos[i].bloco}    i: ${i}  `)
                                        console.log("aqui1")
                                        isolated.push(value.dbId);
                                    }
                                })
                                aux = 1;
                            }
                            //pavimentos anteriores sem formas
                            else if (vetorBlocos[i].status == 1 && aux == 1) {
                                //console.log(vetorBlocos[i].bloco)
                                var qVetorBlocos = vetorBlocos[i].bloco.replace(/\s/g, '');
                                elementos.forEach(value => {
                                    if ((!value.properties[0].displayValue) && '0' + value.properties[1].displayValue == qVetorBlocos) {
                                        console.log("aqui2")
                                        isolated.push(value.dbId);
                                    }
                                })
                            }
                            //obra só com estrutura do piso
                            else if (vetorBlocos[i].status == 0 && vetorBlocos[i].bloco == vetorBlocos[0].bloco) {
                                //var wVetorBlocos = vetorBlocos[0].bloco.replace(/\s/g, '');
                                elementos.forEach(value => {
                                    if (value.properties[1].displayValue == 0) {
                                        console.log("aqui3")
                                        isolated.push(value.dbId);
                                    }
                                })
                            }
                        }
                        viewer.isolate(isolated)
                        viewer.setGhosting(false);
                    });
                });

            });
        });
        // NestedViewerExtension
        viewer.loadExtension("NestedViewerExtension", {
                filter: ["2d", "3d"],
                crossSelection: true
            })
            // NestedViewerExtension
    }

    function onDocumentLoadFailure(viewerErrorCode) {
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }

    /* function onDocumentLoadFailureInteiro(viewerErrorCode) {
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    } */

    function getForgeToken(callback) {
        fetch('/api/forge/oauth/token').then(res => {
            res.json().then(data => {
                callback(data.access_token, data.expires_in);
            });
        });
    }
}




/////////////////


// firebase.analytics();

firebase.database().ref('obras/').once('value', function(snapshot) {
    var i = 0;
    snapshot.forEach(function(item) {
        var select = document.getElementById("obras");
        var options = document.createElement("option");
        opt_txt = document.createTextNode(item.key);
        options.appendChild(opt_txt);
        options.setAttribute("value", item.key);
        select.appendChild(options);
        i++;
    });
    $("#obras").val($("#obras option:first").val());
    var obra = document.getElementById('obras').value;
    //var obra = "Duo Salvador Norte - Teste"
    console.log(obra)
    firebase.database().ref('obras/' + obra + '/sequenciareal').once('value', function(snapshot) {

        //console.log('snaptsho.val: ', snapshot.val())
        var i = 0;
        snapshot.forEach(function(item) {
            var select = document.getElementById("bloco");
            var options = document.createElement("option");
            opt_txt = document.createTextNode(item.key);
            options.appendChild(opt_txt);
            options.setAttribute("value", item.key);
            select.appendChild(options);
            i++;
        });
        $("#bloco").val($("#bloco option:first").val());
    });
})


$('#obras').on('change', function() {
    var obra = document.getElementById('obras').value;
    //var obra = "Duo Salvador Norte - Teste"
    $("#bloco").empty();
    firebase.database().ref('obras/' + obra + '/sequenciareal').once('value', function(snapshot) {
        var i = 0;
        snapshot.forEach(function(item) {
            var select = document.getElementById("bloco");
            var options = document.createElement("option");
            opt_txt = document.createTextNode(item.key);
            options.appendChild(opt_txt);
            options.setAttribute("value", item.key);
            select.appendChild(options);
            i++;
        });
        $("#bloco").val($("#bloco option:first").val());
    });
    showViewer()
});

$('#inteiro-tab').on('click', function() {

    if ($('#forgeViewer1').is(':empty')) {
        showViewer()
    }




})

showViewer()