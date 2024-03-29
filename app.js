import {
  converterDataParaBr,
  converterMoedaParaBRL,
  aplicarMascaraMoeda,
} from "./utils/functions.js";

const buscarDadosLocalStorage = () =>
  JSON.parse(localStorage.getItem("transacoes"));

const persistirTransacoesLocalStorage = (transacoes) => {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
};

const exibirTransacao = ({ id, nome, valor, date }) => {
  const classeASerAplicada = valor < 0 ? "minus" : "plus";
  const li = document.createElement("li");

  li.setAttribute("data-id", id);
  li.classList.add(classeASerAplicada);

  const conteudoLi = `
    <div class="date">${converterDataParaBr(new Date(date))}</div> 
    <span class="title">${nome}</span> 
    <span class="preco">${converterMoedaParaBRL(Math.abs(valor))}</span>
    <button class="edit-btn" data-edit="${id}"></button>
    <button class="delete-btn" data-delete="${id}"></button>
  `;
  li.innerHTML = conteudoLi;
  ulTransacoes.prepend(li);
};

const calcularDespesas = (arrayTransacoes) => {
  const balancoContainer = document.getElementById("balance");
  const receitasContainer = document.getElementById("money-plus");
  const despesasContainer = document.getElementById("money-minus");

  const totalTransacoes = arrayTransacoes.reduce(
    (acc, { valor }) => {
      const transacao = valor < 0 ? "despesas" : "receitas";
      acc[transacao] = acc[transacao] + Math.abs(valor);

      return acc;
    },
    { despesas: 0, receitas: 0 }
  );

  const { receitas, despesas } = totalTransacoes;
  const saldoAtual = receitas - despesas;

  balancoContainer.style.color = saldoAtual >= 0 ? "#2ecc71" : "#c0392b";

  balancoContainer.innerText = converterMoedaParaBRL(saldoAtual);
  receitasContainer.innerText = `+ ${converterMoedaParaBRL(receitas)}`;
  despesasContainer.innerText = `- ${converterMoedaParaBRL(despesas)}`;
};

const atualizarInformacoes = (transacoes) => {
  calcularDespesas(transacoes);

  if (transacoes.length !== 0) {
    ulTransacoes.innerHTML = "";

    persistirTransacoesLocalStorage(transacoes);
    transacoes.forEach(exibirTransacao);
  }
};

const editarTransacao = (event) => {
  event.preventDefault();

  const {
    text: nome,
    date,
    tipo,
    amount: valor,
    id,
  } = Object.fromEntries(new FormData(event.target).entries());

  const transacoes = buscarDadosLocalStorage();

  const indexTransacao = transacoes.findIndex(
    ({ id: idAtual }) => idAtual === id
  );

  transacoes.splice(indexTransacao, 1, {
    nome,
    date,
    tipo,
    valor: tipo === "receita" ? valor : valor * -1,
    id,
  });

  atualizarInformacoes(transacoes);
  event.target.closest(".popup-wrapper").classList.toggle("d-none");
};

const abrirEdicaoDeTransacao = (idTransacao) => {
  const transacoes = buscarDadosLocalStorage();
  const transacaoASerEditada = transacoes.find(
    ({ id }) => +id === +idTransacao
  );

  const popup = document.querySelector(".popup-wrapper");
  const popupEditar = popup.cloneNode(true);

  popupEditar.querySelector("h3").innerText = "Editar transação";
  popupEditar.querySelector(".btn").innerText = "Editar";

  const idInput = document.createElement("input");
  idInput.name = "id";
  idInput.value = transacaoASerEditada.id;
  idInput.hidden = true;

  const formEditar = popupEditar.querySelector("form");
  formEditar.appendChild(idInput);

  const novaData = new Date(transacaoASerEditada.date)
    .toISOString()
    .split("T")[0];

  formEditar.text.value = transacaoASerEditada.nome;
  formEditar.date.value = novaData;
  formEditar.amount.value = Math.abs(transacaoASerEditada.valor);
  Array.from(formEditar.tipo).find(
    (input) => input.value === transacaoASerEditada.tipo
  ).checked = true;

  document.body.append(popupEditar);

  popupEditar.classList.toggle("d-none");
  popupEditar
    .querySelector("#inputValue")
    .addEventListener("keyup", (event) => aplicarMascaraMoeda(event.target));
  popupEditar.addEventListener("click", fecharPopup);
  popupEditar.addEventListener("submit", editarTransacao);
};

const excluirTransacao = (event) => {
  const elementoClicado = event.target;

  if (elementoClicado.tagName === "BUTTON") {
    const liTransacao = elementoClicado.closest("li");
    const idTransacao = liTransacao.dataset.id;
    const transacoes = buscarDadosLocalStorage();

    if (elementoClicado.dataset.delete) {
      const indexTransacao = transacoes.findIndex(
        ({ id }) => id === idTransacao
      );

      transacoes.splice(indexTransacao, 1);
      liTransacao.remove();

      atualizarInformacoes(transacoes);
      persistirTransacoesLocalStorage(transacoes);

      return;
    }

    if (elementoClicado.dataset.edit) {
      abrirEdicaoDeTransacao(idTransacao);
    }
  }
};

const gerarId = () => Date.now() + Math.floor(Math.random() * 1000);

const adicionarTransacao = (event) => {
  event.preventDefault();

  const transacoes = buscarDadosLocalStorage();
  const form = event.target;
  const date = new Date(form.date.value);
  const tipo = form.tipo.value;
  const nome = form.text.value.trim();
  const valor = form.amount.value.trim().replaceAll(",", "");

  if (!nome || !valor) return;

  const despesa = {
    id: gerarId(),
    nome,
    date,
    tipo,
    valor: tipo === "receita" ? valor : valor * -1,
  };

  transacoes.push(despesa);
  atualizarInformacoes(transacoes);

  form.reset();
  popupContainer.classList.toggle("d-none");
};

const abrirPopup = () => {
  const popup = document.querySelector(".popup-wrapper");
  popup.classList.toggle("d-none");
};

function fecharPopup(event) {
  const elementoClicado = event.target;

  if (elementoClicado.classList.contains("popup-close"))
    this.classList.toggle("d-none");
}

const btnAdicionarTransacao = document.getElementById("btn-add-transaction");
btnAdicionarTransacao.addEventListener("click", abrirPopup);

const popupContainer = document.querySelector(".popup-wrapper");
popupContainer.addEventListener("click", fecharPopup);

const form = document.getElementById("form");
form.addEventListener("submit", adicionarTransacao);

const ulTransacoes = document.getElementById("transactions");
ulTransacoes.addEventListener("click", excluirTransacao);

document.addEventListener("keyup", (e) => {
  if (e.target === inputValue) {
    aplicarMascaraMoeda(e.target);
  }
});

window.onload = () => {
  const transacoes = localStorage.getItem("transacoes");

  if (!transacoes) {
    localStorage.setItem("transacoes", JSON.stringify([]));
    return;
  }
  atualizarInformacoes(JSON.parse(transacoes));
};
