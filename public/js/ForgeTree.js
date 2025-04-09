$(document).ready(function () {
  prepareAppBucketTree();

  // Atualiza a árvore de buckets ao clicar no ícone de refresh
  $('#refreshBuckets').click(function () {
      $('#appBuckets').jstree(true).refresh();
  });

  // Cria um novo bucket ao clicar no botão "Create New Bucket"
  $('#createNewBucket').click(async function () {
      const bucketKey = $('#newBucketKey').val();

      // Validação do nome do bucket
      const isValidBucketKey = /^[a-z0-9_-]{3,128}$/.test(bucketKey);
      if (!isValidBucketKey) {
          alert('O nome do bucket deve conter apenas letras minúsculas, números, hífens e underscores, e ter entre 3 e 128 caracteres.');
          return;
      }

      try {
          const token = await apiForge().token(); // Obtém o token de autenticação
          alert("autenticou")
         
          const bucketResponse = await apiForge().criarBucket(bucketKey, token); // Cria o bucket
          
          $('#appBuckets').jstree(true).refresh(); // Atualiza a árvore de buckets
          $('#createBucketModal').modal('toggle'); // Fecha o modal
      } catch (error) {
          console.error('Erro:', error);
          alert('Erro ao criar o bucket. Verifique o console para mais detalhes.');
      }
  });

  // Foca no campo de entrada ao abrir o modal de criação de bucket
  $('#createBucketModal').on('shown.bs.modal', function () {
      $("#newBucketKey").focus();
  });

  // Upload de arquivos
  $('#hiddenUploadField').change(async function () {
      const node = $('#appBuckets').jstree(true).get_selected(true)[0];
      const file = this.files[0];

      if (!file) return;

      try {
          const token = await apiForge().token(); // Obtém o token de autenticação

          // Gera uma URL assinada para upload
          const urlUploadResponse = await apiForge().urlUploadRvt(node.id, file.name.replace('.rvt', ''), token);
          const uploadUrl = urlUploadResponse.contentUploadSignedURL;

          // Faz o upload do arquivo
          await apiForge().uploadRvt(uploadUrl, file);

          alert('Arquivo enviado com sucesso!');
          $('#appBuckets').jstree(true).refresh_node(node); // Atualiza o nó do bucket
          this.value = ''; // Limpa o campo de arquivo
      } catch (error) {
          console.error('Erro:', error);
          alert('Erro ao enviar o arquivo. Verifique o console para mais detalhes.');
      }
  });
});

function prepareAppBucketTree() {
  $('#appBuckets').jstree({
      'core': {
          'themes': { "icons": true },
          'data': {
              "url": '/api/oss/v2/buckets',
              "dataType": "json",
              'multiple': false,
              "data": function (node) {
                  return { "id": node.id };
              }
          }
      },
      'types': {
          'default': {
              'icon': 'glyphicon glyphicon-question-sign'
          },
          '#': {
              'icon': 'glyphicon glyphicon-cloud'
          },
          'bucket': {
              'icon': 'glyphicon glyphicon-folder-open'
          },
          'object': {
              'icon': 'glyphicon glyphicon-file'
          }
      },
      "plugins": ["types", "state", "sort", "contextmenu"],
      contextmenu: { items: autodeskCustomMenu }
  }).on('loaded.jstree', function () {
      $('#appBuckets').jstree('open_all');
  }).bind("activate_node.jstree", function (evt, data) {
      if (data != null && data.node != null && data.node.type == 'object') {
          $("#forgeViewer").empty();
          const urn = data.node.id;
          apiForge().token().then(token => {
              apiForge().statusTraducaoSvf(urn, token)
                  .then(res => {
                      if (res.status === 'success') launchViewer(urn);
                      else $("#forgeViewer").html('The translation job still running: ' + res.progress + '. Please try again in a moment.');
                  })
                  .catch(err => {
                      const msgButton = 'This file is not translated yet! ' +
                          '<button class="btn btn-xs btn-info" onclick="translateObject()"><span class="glyphicon glyphicon-eye-open"></span> ' +
                          'Start translation</button>';
                      $("#forgeViewer").html(msgButton);
                  });
          });
      }
  });
}

function autodeskCustomMenu(autodeskNode) {
  let items;

  switch (autodeskNode.type) {
      case "bucket":
          items = {
              uploadFile: {
                  label: "Upload file",
                  action: function () {
                      uploadFile();
                  },
                  icon: 'glyphicon glyphicon-cloud-upload'
              }
          };
          break;
      case "object":
          items = {
              translateFile: {
                  label: "Translate",
                  action: function () {
                      const treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                      translateObject(treeNode);
                  },
                  icon: 'glyphicon glyphicon-eye-open'
              }
          };
          break;
  }

  return items;
}

function uploadFile() {
  $('#hiddenUploadField').click();
}

async function translateObject(node) {
  $("#forgeViewer").empty();
  if (node == null) node = $('#appBuckets').jstree(true).get_selected(true)[0];
  const bucketKey = node.parents[0];
  const objectKey = node.id;

  try {
      const token = await apiForge().token(); // Obtém o token de autenticação
      const urnEncoded = btoa(`urn:adsk.objects:os.object:${bucketKey}/${objectKey}`);

      const translationResponse = await apiForge().iniciarTraducaoSvf(urnEncoded, token);
      $("#forgeViewer").html('Translation started! Please try again in a moment.');
  } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar a tradução. Verifique o console para mais detalhes.');
  }
}

// Função para inicializar o Forge Viewer
function launchViewer(urn) {
  // Implemente a lógica para inicializar o Forge Viewer aqui
  console.log('Inicializando o Forge Viewer para o URN:', urn);
}