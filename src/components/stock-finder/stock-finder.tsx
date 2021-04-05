import {
  Component,
  Event,
  EventEmitter,
  h,
  State,
} from "@stencil/core/internal";

import { AV_API_KEY } from "../../global/global";

@Component({
  tag: "ap-stock-finder",
  styleUrl: "./stock-finder.css",
  shadow: true,
})
export class StockFinder {
  @State() stockUserInput: string;
  @State() fetchedStocks: { symbol: string; name: string }[];
  @State() errors: string;
  @State() loading = false;

  @Event({ bubbles: true, composed: true }) apStockClick: EventEmitter<string>;

  onUserInput(e: Event) {
    this.stockUserInput = (e.target as HTMLInputElement).value;
  }

  onSymbolClick(symbol: string) {
    this.apStockClick.emit(symbol);
  }

  fetchStockName(event: Event) {
    this.loading = true;
    event.preventDefault();
    fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${this.stockUserInput}&apikey=${AV_API_KEY}`
    )
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Invalid!");
        }

        return res.json();
      })
      .then((data) => {
        this.errors = null;
        this.fetchedStocks = data["bestMatches"].map((stock) => {
          return { symbol: stock["1. symbol"], name: stock["2. name"] };
        });
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        return (this.errors = err.message);
      });
  }

  render() {
    let content = <p>Search a stock name</p>;
    if (this.fetchedStocks) {
      content = (
        <ul>
          {this.fetchedStocks
            ? this.fetchedStocks.map((stock) => (
                <li onClick={this.onSymbolClick.bind(this, stock.symbol)}>
                  <strong>{stock.symbol}</strong> - {stock.name}
                </li>
              ))
            : "Search a stock name"}
        </ul>
      );
    }
    if (this.loading) {
      content = <ap-spinner></ap-spinner>;
    }
    return [
      <form onSubmit={this.fetchStockName.bind(this)}>
        <input
          type="search"
          value={this.stockUserInput}
          onInput={this.onUserInput.bind(this)}
        />
        <button type="submit">Find</button>
      </form>,
      <div>{content}</div>,
    ];
  }
}
