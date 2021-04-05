import {
  Component,
  h,
  Listen,
  Prop,
  State,
  Watch,
} from "@stencil/core/internal";

import { AV_API_KEY } from "../../global/global";

@Component({
  tag: "ap-stock-price",
  styleUrl: "./stock-price.css",
  shadow: true,
})
export class StockPrice {
  stockInput: HTMLInputElement;
  stockInputValid = false;

  @State() fetchedPrice: number;
  @State() stockUserInput: string;
  @State() errors: string;
  @State() loading = false;

  @Prop({ mutable: true, reflect: true }) stockSymbol: string;
  @Watch("stockSymbol")
  stockSymbolChanged(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.stockInputValid = true;
      this.stockUserInput = newValue;
      this.fetchStockPrice(newValue);
    }
  }

  onFetchStockPrice(e: Event) {
    e.preventDefault();
    this.stockSymbol = this.stockInput.value;
  }

  @Listen("apStockClick", { target: "body" })
  onStockSelect(event: CustomEvent) {
    if (event.detail && event.detail !== this.stockSymbol) {
      this.stockSymbol = event.detail;
    }
  }

  onUserInput(event: Event) {
    this.stockUserInput = (event.target as HTMLInputElement).value;
    if (this.stockUserInput.trim() !== "") {
      this.stockInputValid = true;
    }
  }

  fetchStockPrice(stockSymbol: string) {
    this.loading = true;
    fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=${AV_API_KEY}`
    )
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Invalid!");
        }

        return res.json();
      })
      .then((data) => {
        if (!data["Global Quote"]["05. price"]) {
          throw new Error("Invalid symbol!");
        }
        this.errors = null;
        this.fetchedPrice = +data["Global Quote"]["05. price"];
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        this.fetchedPrice = null;
        return (this.errors = err.message);
      });
  }

  componentWillLoad() {
    if (this.stockSymbol) {
      this.stockUserInput = this.stockSymbol;
      this.fetchStockPrice(this.stockSymbol);
    }
  }

  render() {
    let content = <p>Please, enter a symbol</p>;
    if (this.fetchedPrice) {
      content = <p>Price: ${this.fetchedPrice}</p>;
    }

    if (this.errors) {
      content = <p>{this.errors}</p>;
    }

    if (this.loading) {
      content = <ap-spinner></ap-spinner>;
    }
    return [
      <form onSubmit={this.onFetchStockPrice.bind(this)}>
        <input
          id="stock-symbol"
          ref={(element) => (this.stockInput = element)}
          value={this.stockUserInput}
          onInput={this.onUserInput.bind(this)}
        />
        <button type="submit" disabled={!this.stockInputValid || this.loading}>
          Fetch
        </button>
      </form>,
      <div>{content}</div>,
    ];
  }
}
