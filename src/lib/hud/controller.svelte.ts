export class HudController {
  #items: HudItem[] = $state([]);

  get items() {
    return this.#items;
  }

  private set items(value: HudItem[]) {
    this.#items = value;
  }

  add(message: string) {
    const id = Symbol(Math.random().toString(36).substring(2, 15));

    const item: HudItem = {
      message,
      id,
      deleteMe: setTimeout(
        () => {
          this.remove(id);
        },
        3000, // time to read + 20% buffer
      ),
    };

    this.items.push(item);
  }
  remove(id: Symbol) {
    this.items = this.items.filter((i) => i.id !== id);
  }
}

type HudItem = {
  message: string;
  id: Symbol;
  deleteMe: ReturnType<typeof setTimeout>;
};
