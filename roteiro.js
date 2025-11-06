document.addEventListener("DOMContentLoaded", () => {
  const formRoteiro = document.getElementById("form-roteiro");
  const botaoGerar = document.getElementById("gerar-roteiro-btn");
  const spanBotao = botaoGerar.querySelector("span");
  const svgBotao = botaoGerar.querySelector("svg");

  renderizarHistorico();

  formRoteiro.addEventListener("submit", (event) => {
    event.preventDefault();

    botaoGerar.disabled = true;
    spanBotao.textContent = "Gerando...";
    svgBotao.classList.add("animate-spin");

    const destino = document.getElementById("destino").value;
    const dataInicio = document.getElementById("data-inicio").value;
    const dataFim = document.getElementById("data-fim").value;
    const orcamentoValor = document.getElementById("orcamento").value;
    const orcamentoTexto = orcamentoValor < 50 ? "Moderado" : "Luxo";

    const estilosSelecionados = [];
    const checkboxesEstilo = document.querySelectorAll('input[id^="style-"]:checked');
    checkboxesEstilo.forEach((checkbox) => {
      const label = document.querySelector(`label[for="${checkbox.id}"]`);
      estilosSelecionados.push(label.textContent.trim());
    });

    const dataInicioFormatada = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dataInicio));
    const dataFimFormatada = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dataFim));
    const datasFormatadas = `De ${dataInicioFormatada} a ${dataFimFormatada}`;

    const prompt = montarPrompt(destino, dataInicio, dataFim, orcamentoTexto, estilosSelecionados);

    callGeminiApi(prompt)
      .then((htmlResposta) => {
        sessionStorage.setItem("roteiroHtml", htmlResposta);
        sessionStorage.setItem("roteiroTitulo", destino);
        sessionStorage.setItem("roteiroDatas", datasFormatadas);

        salvarViagemNoHistorico(destino, datasFormatadas, estilosSelecionados, htmlResposta);

        window.location.href = "roteiro.html";
      })
      .catch((error) => {
        console.error("Erro ao gerar roteiro:", error);
        alert("Ocorreu um erro. Tente novamente.");
      })
      .finally(() => {
        botaoGerar.disabled = false;
        spanBotao.textContent = "Gerar Roteiro Mágico";
        svgBotao.classList.remove("animate-spin");
      });
  });
});

function salvarViagemNoHistorico(destino, datas, estilos, htmlRoteiro) {
  const novoRoteiro = {
    id: Date.now().toString(),
    destino: destino,
    datas: datas,
    estilos: estilos,
    html: htmlRoteiro,
  };

  const historico = JSON.parse(localStorage.getItem("historicoViagens")) || [];

  historico.unshift(novoRoteiro);

  localStorage.setItem("historicoViagens", JSON.stringify(historico));

  renderizarHistorico();
}

function renderizarHistorico() {
  const container = document.getElementById("historico-container");
  const msgVazio = document.getElementById("historico-vazio");
  const historico = JSON.parse(localStorage.getItem("historicoViagens")) || [];

  container.innerHTML = "";

  if (historico.length === 0) {
    msgVazio.style.display = "block";
    return;
  }

  msgVazio.style.display = "none";

  historico.forEach((roteiro) => {
    const estilosHtml = roteiro.estilos
      .map(
        (estilo) =>
          `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">${estilo}</span>`
      )
      .join(" ");

    const cardHtml = `
        <article class="bg-white rounded-2xl shadow-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=1080&fit=max" 
                 alt="Imagem de ${roteiro.destino}" class="w-full h-48 object-cover">
            
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900">${roteiro.destino}</h3>
                <p class="text-sm text-gray-500 mt-1">${roteiro.datas}</p>
                
                <div class="flex flex-wrap gap-2 mt-3 mb-4">
                    ${estilosHtml}
                </div>

                <a href="#" class="ver-roteiro-btn bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors" data-trip-id="${roteiro.id}">
                    Ver Roteiro
                </a>
            </div>
        </article>
        `;

    container.insertAdjacentHTML("beforeend", cardHtml);
  });

  adicionarListenersAosBotoesDoHistorico(historico);
}

function adicionarListenersAosBotoesDoHistorico(historico) {
  document.querySelectorAll(".ver-roteiro-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      const tripId = e.target.getAttribute("data-trip-id");

      const roteiroClicado = historico.find((trip) => trip.id === tripId);

      if (roteiroClicado) {
        sessionStorage.setItem("roteiroHtml", roteiroClicado.html);
        sessionStorage.setItem("roteiroTitulo", roteiroClicado.destino);
        sessionStorage.setItem("roteiroDatas", roteiroClicado.datas);

        window.location.href = "roteiro.html";
      }
    });
  });
}

function montarPrompt(destino, inicio, fim, orcamento, estilos) {
  return `
    Você é um assistente de viagens expert.
    Gere um roteiro de viagem detalhado para ${destino}, de ${inicio} até ${fim}.
    O orçamento é baseado em ${orcamento} % sendo 0% para o mais barato e 100% para o mais caro.
    Os estilos de viagem preferidos são: ${estilos.join(", ")}.

    Responda APENAS com o código HTML para a lista de dias do roteiro.
    NÃO inclua <html>, <head>, <body>, <main> ou <section>.
    Comece o primeiro dia com <div class="pt-0"> e os seguintes com <div class="pt-8">.
    
    Siga EXATAMENTE esta estrutura HTML para CADA dia:

    <div class="pt-8 first:pt-0">
        <div class="flex items-baseline gap-3 mb-6">
            <h3 class="text-2xl font-bold text-gray-800">Dia X: [Título do Dia]</h3>
            <p class="text-gray-500 font-medium">[Data do Dia, ex: 10 de Dezembro]</p>
        </div>
        <div class="space-y-6">
            <div class="flex items-start gap-4">
                <span class="font-bold text-gray-800 w-16 text-right">[HH:MM]</span>
                <div class="flex-1">
                    <h4 class="font-semibold text-lg text-gray-900">[Nome da Atividade]</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">[Tag 1]</span>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">[Tag 2]</span>
                    </div>
                </div>
            </div>
            <div class="flex items-start gap-4">
                <span class="font-bold text-gray-800 w-16 text-right">[HH:MM]</span>
                <div class="flex-1">
                    <h4 class="font-semibold text-lg text-gray-900">[Nome da Atividade]</h4>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">[Tag 1]</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

async function callGeminiApi(prompt) {
  if (typeof API_KEY === "undefined" || API_KEY === "A_SUA_CHAVE_DE_API_DO_GEMINI_VEM_AQUI") {
    alert("Erro de configuração: A API Key não foi encontrada. Verifique o seu ficheiro config.js");
    throw new Error("API_KEY não definida.");
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
    generationConfig: {
      response_mime_type: "text/plain",
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API:", errorData);
      throw new Error(`Erro de rede: ${response.status} - ${errorData.error.message}`);
    }

    const data = await response.json();

    if (data.promptFeedback && data.promptFeedback.blockReason) {
      throw new Error(`API bloqueou o prompt: ${data.promptFeedback.blockReason}`);
    }

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      console.error("Resposta da API em formato inesperado:", data);
      throw new Error("A API retornou uma resposta vazia ou em formato inesperado.");
    }

    const htmlResposta = data.candidates[0].content.parts[0].text;

    console.log("--- RESPOSTA HTML RECEBIDA DA API GEMINI ---");
    console.log(htmlResposta);

    return htmlResposta;
  } catch (error) {
    console.error("Falha na chamada à API:", error);
    alert(`Falha ao contactar a IA: ${error.message}`);
    throw error;
  }
}
