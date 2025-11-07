document.addEventListener("DOMContentLoaded", () => {
  const titulo = sessionStorage.getItem("roteiroTitulo");
  const datas = sessionStorage.getItem("roteiroDatas");
  const htmlRoteiro = sessionStorage.getItem("roteiroHtml");

  const tituloElemento = document.getElementById("roteiro-titulo");
  const datasElemento = document.getElementById("roteiro-datas");
  const listaElemento = document.getElementById("lista-roteiro");

  if (htmlRoteiro && titulo && datas && listaElemento) {
    tituloElemento.textContent = `Seu Roteiro para ${titulo}`;
    datasElemento.textContent = datas;
    listaElemento.innerHTML = htmlRoteiro; // Insere o HTML da IA

    sessionStorage.removeItem("roteiroTitulo");
    sessionStorage.removeItem("roteiroDatas");
    sessionStorage.removeItem("roteiroHtml");
  } else if (listaElemento) {
    tituloElemento.textContent = "Nenhum roteiro encontrado";
    datasElemento.textContent = "Por favor, volte à página inicial para criar o seu roteiro mágico.";
    listaElemento.innerHTML = "";
  }
});
