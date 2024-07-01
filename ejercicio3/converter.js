class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    getCurrencies() {
        return fetch(`${this.apiUrl}/currencies`)
            .then(response => response.json())
            .then(data => {
                this.currencies = Object.keys(data).map(code => new Currency(code, data[code]));
            })
            .catch(error => {
                console.error("Error fetching currencies:", error);
            });
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return Promise.resolve(amount);
        }

        return fetch(`${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`)
            .then(response => response.json())
            .then(data => {
                return data.rates[toCurrency.code];
            })
            .catch(error => {
                console.error("Error converting currency:", error);
                return null;
            });
    }

    getExchangeRateDifference(fromCurrency, toCurrency) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let rateToday, rateYesterday;

        return fetch(`${this.apiUrl}/${today}?from=${fromCurrency.code}&to=${toCurrency.code}`)
            .then(responseToday => responseToday.json())
            .then(dataToday => {
                rateToday = dataToday.rates[toCurrency.code];
                return fetch(`${this.apiUrl}/${yesterday}?from=${fromCurrency.code}&to=${toCurrency.code}`);
            })
            .then(responseYesterday => responseYesterday.json())
            .then(dataYesterday => {
                rateYesterday = dataYesterday.rates[toCurrency.code];
                return rateToday - rateYesterday;
            })
            .catch(error => {
                console.error("Error fetching exchange rate difference:", error);
                return null;
            });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    converter.getCurrencies()
        .then(() => {
            populateCurrencies(fromCurrencySelect, converter.currencies);
            populateCurrencies(toCurrencySelect, converter.currencies);
        });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(currency => currency.code === fromCurrencySelect.value);
        const toCurrency = converter.currencies.find(currency => currency.code === toCurrencySelect.value);

        converter.convertCurrency(amount, fromCurrency, toCurrency)
            .then(convertedAmount => {
                if (convertedAmount !== null && !isNaN(convertedAmount)) {
                    resultDiv.textContent = `${amount} ${fromCurrency.code} son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
                } else {
                    resultDiv.textContent = "Error al realizar la conversión.";
                }
            });
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach(currency => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
