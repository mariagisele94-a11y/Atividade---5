
// Coordenadas aproximadas da UNINASSAU Parangaba
const ORIGEM = {
    lat: -3.7787,
    lon: -38.5668
};

// Preço base estimado do Uber Moto
const UBER_BASE = 5.00;

// Valor estimado por quilômetro
const UBER_POR_KM = 1.35;

// Taxa mínima do frete
const FRETE_MINIMO = 8.00;


const cepInput = document.getElementById("cep");
const buscarCep = document.getElementById("buscarCep");

const endereco = document.getElementById("endereco");

const logradouro = document.getElementById("logradouro");
const bairro = document.getElementById("bairro");
const cidade = document.getElementById("cidade");
const uf = document.getElementById("uf");

const resultado = document.getElementById("resultado");

const distanciaElement = document.getElementById("distancia");
const uberElement = document.getElementById("uber");
const freteElement = document.getElementById("frete");
const totalElement = document.getElementById("total");

const loading = document.getElementById("loading");
const erro = document.getElementById("erro");

const form = document.getElementById("freteForm");


cepInput.addEventListener("input", function () {

    let cep = this.value.replace(/\D/g, "");

    if (cep.length > 5) {
        cep = cep.substring(0, 5) + "-" + cep.substring(5, 8);
    }

    this.value = cep;
});


buscarCep.addEventListener("click", consultarCEP);

async function consultarCEP() {

    const cep = cepInput.value.replace(/\D/g, "");

    limparErro();

    if (cep.length !== 8) {

        mostrarErro("Digite um CEP válido com 8 números.");

        return;
    }

    loading.classList.remove("hidden");

    endereco.classList.add("hidden");

    try {

        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        const dados = await resposta.json();

        if (dados.erro) {

            throw new Error("CEP não encontrado.");

        }

        logradouro.textContent = dados.logradouro || "Não informado";
        bairro.textContent = dados.bairro || "Não informado";
        cidade.textContent = dados.localidade || "Não informado";
        uf.textContent = dados.uf || "Não informado";

        endereco.classList.remove("hidden");

    } catch (error) {

        mostrarErro(error.message);

    } finally {

        loading.classList.add("hidden");

    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = grausParaRadianos(lat2 - lat1);

    const dLon = grausParaRadianos(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(grausParaRadianos(lat1)) *
        Math.cos(grausParaRadianos(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

function grausParaRadianos(graus) {
    return graus * Math.PI / 180;
}


async function obterCoordenadas() {

    const enderecoCompleto =
        `${logradouro.textContent}, ${bairro.textContent}, ${cidade.textContent}, ${uf.textContent}, Brasil`;

    const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&limit=1&countrycodes=br&q=` +
        encodeURIComponent(enderecoCompleto);

    const resposta = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    const dados = await resposta.json();

    if (!dados.length) {

        throw new Error(
            "Não foi possível localizar o endereço no mapa."
        );

    }

    return {
        lat: parseFloat(dados[0].lat),
        lon: parseFloat(dados[0].lon)
    };
}

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    limparErro();

    if (endereco.classList.contains("hidden")) {

        mostrarErro(
            "Primeiro consulte um CEP válido."
        );

        return;
    }

    try {

        resultado.classList.add("hidden");

        loading.classList.remove("hidden");

        const destino = await obterCoordenadas();

        const distancia = calcularDistancia(
            ORIGEM.lat,
            ORIGEM.lon,
            destino.lat,
            destino.lon
        );

        

        const uber =
            UBER_BASE +
            (distancia * UBER_POR_KM);


        let frete;

        if (distancia <= 3) {

            frete = FRETE_MINIMO;

        } else if (distancia <= 8) {

            frete = 10 + (distancia - 3) * 1.50;

        } else {

            frete = 17.50 + (distancia - 8) * 1.80;

        }


        
        frete = Math.ceil(frete * 100) / 100;

        const total = frete;

        distanciaElement.textContent =
            `${distancia.toFixed(2)} km`;

        uberElement.textContent =
            formatarMoeda(uber);

        freteElement.textContent =
            formatarMoeda(frete);

        totalElement.textContent =
            formatarMoeda(total);

        resultado.classList.remove("hidden");

    } catch (error) {

        mostrarErro(error.message);

    } finally {

        loading.classList.add("hidden");

    }

});


function formatarMoeda(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function mostrarErro(mensagem) {

    erro.textContent = mensagem;

    erro.classList.remove("hidden");

}

function limparErro() {

    erro.textContent = "";

    erro.classList.add("hidden");

}
