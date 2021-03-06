import {html, render} from "lit-html";
import "./ui/component/CompElement";
import "./ui/PlaygroundElement";
import "./ui/ToolboxElement";
import {Game} from "./game/Game";
import {CELL_SIZE, GAME_HEIGHT, GAME_WIDTH} from "./util/Constants";
import {GameCompTemplate} from "./game/GameComp";
import {ComponentTemplate, PinType} from "./logic/ComponentTemplate";

let game = new Game();

let template = new ComponentTemplate();
template.type = "";
template.components = [];
template.wires = [];
template.inputPins = [{
    name: "Cin",
    type: PinType.BOOL,
    width: 1,
},{
    name: "A",
    type: PinType.BOOL,
    width: 1,
},{
    name: "B",
    type: PinType.BOOL,
    width: 1,
}];
template.outputPins = [{
    name: "Sum",
    type: PinType.UNSIGNED,
    width: 1,
}, {
    name: "Cout",
    type: PinType.UNSIGNED,
    width: 1,
}];
game.load(template);

let templates = [
    {name: "not", type: "not", w: 2, h: 1},
    {name: "and", type: "and", w: 3, h: 2},
    {name: "or", type: "or", w: 3, h: 2},
    {name: "xor", type: "xor", w: 3, h: 2},
];

function addTemplateComponent(template: GameCompTemplate, startX: number) {
    game.editor.component.createTemplateComponent(template, startX, -2);
}

function addTemplateComponents() {
    let x = 1;
    for (let template of templates) {
        addTemplateComponent(template, x);
        x += 3;
    }
}

addTemplateComponents();

let width = CELL_SIZE * GAME_WIDTH;
let height = CELL_SIZE * GAME_HEIGHT;

render(html`
    <div id="content" style="width: ${width}px; height: ${height}px;">
        <style>
            :root {
                --cell-size: ${CELL_SIZE}px;
            }
        </style>

        <div id="container" style="position: absolute; width: ${width}px; height: ${height}px;">
            <playground-element .game=${game}></playground-element>
            <toolbox-element .game=${game}></toolbox-element>
        </div>
    </div>
`, document.body);