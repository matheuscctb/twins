class ManutencaoViewerExtension extends Autodesk.Viewing.Extension {

    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    load() {
        console.log('ManutencaoViewerExtensions has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('ManutencaoViewerExtensions has been unloaded');
        return true;
    }


    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('nestedViewerExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('nestedViewerExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('ManutencaoViewerExtensionButton');
        this._button.onClick = (ev) => {
            console.log('clicou')

            var vetorTodosElementos = [];
            //encontra todos os dbIds da visualização
            getAllLeafComponents(viewer, (dbIds) => {
                    //Propriedade que quero buscar das formas
                    const filteredProps = ['Numeração das formas', "Agrupamentos"];
                    // Get only the properties we need for the leaf dbIds
                    this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                        // Iterate through the elements we found
                        items.forEach((item) => {
                            // and iterate through each property
                            item.properties.forEach(function (prop) {
                                if (prop.displayValue) {
                                    vetorTodosElementos.push(item);
                                }
                            });
                        });
                        //Seleciono todas as formas com informações de agrupamentos e numeração
                        var formas = []
                        vetorTodosElementos.forEach((value) => {
                            if (value.properties[0].displayValue && value.properties[1].displayValue) {
                                formas.push(value);
                            }
                        })
                        //As formas acabaram duplicadas, aqui acontece a separação
                        const formasFinal = [...new Set(formas)];

                        //Localizar RFID com a data da leitura no Firebase
                        const x = getInfoLeituras(formasFinal)
                            .then(
                                res => {
                                    getHistorico(res).then(response => {
                                        console.log(response)
                                    })
                                })
                    });
                }
            );
        };
        this._button.setToolTip('Manuntenção & Defeito');
        this._button.addClass('ManutencaoViewerExtensionIcon');
        this._group.addControl(this._button);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('ManutencaoViewerExtension', ManutencaoViewerExtension);

async function getRfidAndData(data) {
    for (const value of data) {
        let agrupamento = value.properties[0].displayValue;
        let numero = value.properties[1].displayValue;
        await getInfoRfidDataFirebase(agrupamento, numero).then(response => {
            if (response[0] && response[1]) {
                value.properties[2] = {displayName: "rfid", displayValue: response[0]};
                value.properties[3] = {displayName: "dataLeitura", displayValue: response[1]};
            } else {
                value.properties[2] = {displayName: "rfid", displayValue: null};
                value.properties[3] = {displayName: "dataLeitura", displayValue: null};
            }
        })
    }
    return await data;
    return data;
}

async function getInfoLeituras(data) {
    return await getRfidAndData(data)
}

function getInfoRfidDataFirebase(agrupamento, numero) {
    return new Promise(resolve => {
        if (agrupamento && numero) {
            var obra = document.getElementById('obras').value;
            firebase.database().ref('obras/Alphaville/sequenciareal/' + obra + '/0' + agrupamento).once('value').then(snapshot => {
                var rfId = snapshot.child(numero).child("codRfid").val();
                var data = snapshot.child(numero).child("data").val();
                if (rfId && data) {
                    resolve([rfId, data])
                } else {
                    resolve([null, null])
                }
            });
        }
    });
}

async function getHistorico(data) {
    console.log('info')
    return await getHistoricoFormas(data)
}

async function getHistoricoFormas(data) {
    for (const value of data) {
        let rfid = value.properties[2].displayValue;
        let data = value.properties[3].displayValue;
        if (rfid && data) {
            await getHistoricoDefeitosFormasFirebase(rfid, data).then(response => {
                value.properties[4] = {displayName: "defeitoData", displayValue: response[0]};
            })
            await getHistoricoManutencaoFormasFirebase(rfid, data).then(response => {
                value.properties[5] = {displayName: "manutencaoData", displayValue: response[0]};
            })
            //se só tiver data deifeito
            //Cor vermelha
            if (value.properties[4].displayValue && value.properties[5].displayValue == null) {
                viewer.setThemingColor(value.dbId, new THREE.Vector4(1, 0, 0, 1));
            }
                //se tiver data defeito mairo que data manutenção
            //Cor vermelha
            else if (value.properties[4].displayValue > value.properties[5].displayValue) {
                viewer.setThemingColor(value.dbId, new THREE.Vector4(1, 0, 0, 1));
            }
                //se tiver data manutenção maior que  data defito
            //Cor verde
            else if (value.properties[4].displayValue < value.properties[5].displayValue) {
                viewer.setThemingColor(value.dbId, new THREE.Vector4(0, 1, 0, 1));
            }

            // await getHistoricoFormasFirebase(rfid,data).then(response => {
            //         if (response[0] && response[1]) {
            //             console.log('info')
            //
            //             console.log(response[0]);
            //             console.log(response[1]);
            //             // value.properties[4] = {displayName: "defeito", displayValue: response[0]};
            //             // value.properties[5] = {displayName: "defeitoData", displayValue: response[0]};
            //             // value.properties[4] = {displayName: "manutencao", displayValue: response[0]};
            //             // value.properties[5] = {displayName: "manutencaoData", displayValue: response[0]};
            //         }
            //     })
            // }
        } else {
            // value.properties[4] = {displayName: "defeito", displayValue: null};
            value.properties[4] = {displayName: "defeitoData", displayValue: null};
            // value.properties[4] = {displayName: "manutencao", displayValue: null};
            value.properties[6] = {displayName: "manutencaoData", displayValue: null};
        }
    }


    return await data;
    return data;
}

function getHistoricoDefeitosFormasFirebase(rfid, data) {
    return new Promise(resolve => {
        if (rfid) {
            firebase.database().ref('formas/' + rfid + '/historico/defeitos').orderByKey().endAt(data).limitToLast(1).once('value').then(snapshot => {
                var objDefeito = snapshot.val();//objeto com as informações do defeito
                let data = Object.keys(objDefeito);//indice do vetor de objeto
                // resolve([data,objDefeito]);
                if (data) {
                    resolve(data);
                } else {
                    resolve(null);
                }
            });

        }
    });
}

function getHistoricoManutencaoFormasFirebase(rfid, data) {
    return new Promise(resolve => {
        if (rfid) {
            firebase.database().ref('formas/' + rfid + '/historico/manutencao').orderByKey().endAt(data).limitToLast(1).once('value').then(snapshot => {
                var objManutencao = snapshot.val();//objeto com as informações do manutenção
                let data = Object.keys(objManutencao);//indice do vetor de objeto
                // resolve([data,objManutencao]);
                if (data) {
                    resolve(data);
                } else {
                    resolve(null);
                }
            });

        }
    });
}

// function getHistoricoFormasFirebase(rfid,data) {
//     return new Promise(resolve => {
//         console.log('info')
//         if (rfid) {
//             firebase.database().ref('formas').once('value').then(snapshot => {
//                 var objDefeito = snapshot.child(rfid).child('historico/defeitos').val();
//                 var objManutencao = snapshot.child(rfid).child('historico/manutencao').val();
//
//                 console.log(objDefeito)
//                 if (objDefeito && objManutencao) {
//                     resolve([objDefeito, objManutencao])
//                 } else {
//                     resolve([null, null])
//                 }
//             });
//         }
//     });
// }