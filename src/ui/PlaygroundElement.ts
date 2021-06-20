import {customElement, html, LitElement, property, PropertyValues} from "lit-element";
import "./component/CompElement";
import "./component/PinElement";
import "./component/WireElement";
import {Game} from "../game/Game";
import {Events} from "../util/Events";
import {CELL_SIZE} from "../util/Constants";

@customElement('playground-element')
export class PlaygroundElement extends LitElement {
    @property()
    game: Game;

    protected firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);

        let callback = (_obj: any) => {
            this.requestUpdateInternal();
        };
        this.game.on(Events.COMPONENT_ADD, this, callback, false, true);
        this.game.on(Events.COMPONENT_REMOVE, this, callback, false, true);
        this.game.on(Events.COMPONENT_UPDATE, this, callback, false, true);
        this.game.on(Events.WIRE_ADD, this, callback, false, true);
        this.game.on(Events.WIRE_REMOVE, this, callback, false, true);
        this.game.on(Events.WIRE_UPDATE, this, callback, false, true);
    }

    protected render() {
        let components = this.game.components.map(component => html`<gamecomp-element id="gameComp_${component.id}" .game=${this.game} .gameComp=${component} style="position: absolute;" />`);
        let wires = this.game.wires.map(wire => html`<wire-element .gam=${this.game} .gameWire=${wire} />`);

        //TODO extract playground size
        let width = CELL_SIZE * 30;
        let height = CELL_SIZE * 20;

        return html`
            <div id="playground" style="width: ${width}px; height: ${height}px">
                <div class="components">${components}</div>
                <div class="wires">${wires}</div>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }

}