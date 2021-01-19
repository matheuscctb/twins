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



// firebase.analytics();


















var viewer;
var viewer1;

function showViewer() {



    var options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2', // TODO: for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: getForgeToken
    };

    viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), {
        extensions: ['PanelInfoViewerExtension']
    });
    Autodesk.Viewing.Initializer(options, function(event) {



        var tipo = document.querySelector('[aria-selected="true"]').textContent;
        if (tipo == "Tempo Real") {

            viewer.start();

            var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d2djaWloemhodW11Z2J6Z29jc2dhaXZ0ZWpjbXZldHotc25yL1NOUl9IQUJfRklYXzAyXzIwMTlfUjEucnZ0';

            //var documentId = 'urn:' + urn;
            Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
        } else {
            setTimeout(function() {
                viewer1 = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer1'), {
                    extensions: ['ManutencaoViewerExtension', 'PanelInfoViewerExtension', ]


                });

                viewer1.start()

                var documentId1 = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d2djaWloemhodW11Z2J6Z29jc2dhaXZ0ZWpjbXZldHotc25yL1NOUl9IQUJfRklYXzAyXzIwMTlfUjEucnZ0';

                Autodesk.Viewing.Document.load(documentId1, onDocumentLoadSuccess1, onDocumentLoadFailure1);
            }, 300);

        }







    });

    function onDocumentLoadSuccess1(doc) {
        // if a viewableId was specified, load that view, otherwise the default view
        var viewables1 = doc.getRoot().getDefaultGeometry();
        viewer1.loadDocumentNode(doc, viewables1).then(i => {
            // any additional action here?
        });
    }

    function onDocumentLoadFailure1(viewerErrorCode) {
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
            $('#PanelInfoViewerExtensionButton').on('click', function() {
                console.log(screen.width)
                if (screen.width >= 1000) {
                    $('#mypanel').append('<button id="btn-close" style="display: block;"></button>')

                    $('#btn-close').on('click', function() {
                        $('#mypanel').toggle();
                        $('#btn-close').toggle();




                    })
                }





            })

            if (bloco == "empty") {
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
                        elementos.forEach(value => {
                            //Sem forma
                            if (value.properties.length == 1) {
                                //Só a fundação
                                if (value.properties[0].displayValue == "P0") {
                                    isolated.push(value.dbId);
                                }
                            }
                        })



                        viewer.isolate(isolated)
                        viewer.setGhosting(false);
                    });
                });

            } else {


                firebase.database().ref('obras/' + obra + '/sequenciareal/' + bloco).once('value').then(snapshot => {
                    let identificacao = ""

                    snapshot.forEach(function(pavimento) {
                        pavimento.forEach((meiopavimento) => {
                            //Identifica se os meio pavimento em construção
                            if (parseInt(pavimento.key.substr(1), 10) >= 10) {
                                identificacao = pavimento.key + meiopavimento.key
                            } else {
                                identificacao = pavimento.key.substr(0, 1) + pavimento.key.substr(2) + meiopavimento.key
                            }
                            vetorBlocos.push(identificacao)
                        })


                    });
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


                            elementos.forEach(value => {
                                //Sem forma

                                if (value.properties.length == 1) {


                                    for (i = vetorBlocos.length - 1; i >= 0; i--) {
                                        //Identifica os pavimentos já construídos/em construção
                                        if (value.properties[0].displayValue == vetorBlocos[i] ||
                                            value.properties[0].displayValue == "P0") {
                                            isolated.push(value.dbId);

                                        }
                                    }



                                } else {
                                    //Com forma
                                    if (value.properties[0].displayValue.substr(0, 6) == vetorBlocos[vetorBlocos.length - 1]) {
                                        isolated.push(value.dbId);

                                    }
                                }
                            })



                            viewer.isolate(isolated)
                            viewer.setGhosting(false);
                        });
                    });

                });
            }
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



$('#obras').on('change', function() {
    var obra = $('#obras').val();
    $("#bloco").empty();
    $('[apagar="inteiro"]').html(`<div class="col-lg-12" id="forgeViewer1"></div>`)
    $('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"></div>`)
    firebase.database().ref('obras/' + obra).on('value', function(snapshot) {
        if (snapshot.child('sequenciareal').val()) {
            snapshot.child('sequenciareal').forEach(function(bloco) {
                $('#bloco').append(`<option value="${bloco.key}">${bloco.key}</option>`)
            });
            $('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"></div>`)
            showViewer()
        } else {
            $('#bloco').append(`<option value="empty">Sem Bloco</option>`)
            showViewer()
                //$('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)

        }
    })



});



$('#inteiro-tab').on('click', function() {
    if ($('#bloco').val() != "empty") {

        if ($('#forgeViewer1').is(':empty')) {
            showViewer()
        }
    } else {
        showViewer()
            //$('[apagar="inteiro"]').html(`<div class="col-lg-12" id="forgeViewer1"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)
    }




})

$('#bloco').on('change', function() {
    showViewer()
})


firebase.database().ref('obras/').on('value', function(snapshot) {

    $('#obras').html('');
    snapshot.forEach((obra) => {
        $('#obras').append(`<option value="${obra.key}">${obra.key}</option>`)
    });

    if (snapshot.child($('#obras').val()).child('sequenciareal')) {
        snapshot.child($('#obras').val()).child('sequenciareal').forEach(function(bloco) {
            $('#bloco').append(`<option value="${bloco.key}">${bloco.key}</option>`)
        });
    } else {
        $('#bloco').append(`<option value="empty">Sem Bloco</option>`)
            //$('[apagar="real"]').html(`<div class="col-lg-12" id="forgeViewer"><img src="./img/erromodelo.jpg" alt="Erro Modelo" class="col-lg-12 shadow" ></div>`)
    }
    showViewer()

})

$('#btn-close1 ').on('click', function() {
    $('#mypanel').toggle();
    $('#btn-close1').toggle();




})