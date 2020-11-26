import {ComponentTemplate, PinType} from "./ComponentTemplate";
import {error} from "./util";

export type ComponentGenerator = (name: string, componentLibrary: Map<string, ComponentGenerator>) => Component;

export class Pin {
    readonly name: string;
    readonly width: number;
    readonly type: PinType;
    private data: number;

    constructor(name: string, width: number, type: PinType, data: number) {
        this.name = name;
        this.width = width;
        this.type = type;
        this.data = data;
    }

    read() {
        return this.data;
    }

    write(data: number, width: number) {
        if (this.width !== width) error("Write width not matched!");
        this.data = data;
    }

    needRun: false;
    run() {
    }
}

export class Wire {
    name: string;
    fromComponent: Component;
    fromPin: Pin;
    toComponent: Component;
    toPin: Pin;

    constructor(name: string, fromComponent: Component, fromPin: Pin, toComponent: Component, toPin: Pin) {
        this.name = name;
        this.fromComponent = fromComponent;
        this.fromPin = fromPin;
        this.toComponent = toComponent;
        this.toPin = toPin;
    }

    needRun: boolean = true;
    run() {
        if (this.fromPin.width !== this.toPin.width) error("toPin width not matched!");
        this.toPin.write(this.fromPin.read(), this.fromPin.width);
    }
}

export class DummyWire extends Wire {
    constructor() {
        super("", null, null, null, null);
    }

    needRun: boolean = false;
    run() {
    }
}

export class Component {
    name: string;
    readonly isCustom: boolean; //是否是用自定义的Component，如果是=>Component用于连接内部组件，如果不是=>使用run方法执行逻辑
    readonly type: string;

    inputPins: Map<string, Pin>;
    components: Map<string, Component>;
    outputPins: Map<string, Pin>;

    wires: Wire[];

    constructor(name: string, isCustom: boolean, template: ComponentTemplate, componentLibrary: Map<string, ComponentGenerator>) {
        this.name = name;
        this.isCustom = isCustom;
        this.needRun = !isCustom;
        this.type = template.type;

        //根据模板设置自己的内容

        this.inputPins = new Map<string, Pin>();
        this.components = new Map<string, Component>();
        this.outputPins = new Map<string, Pin>();
        this.wires = [];

        let components = template.components;
        for (let component of components) {
            let generator = componentLibrary.get(component.type);
            if (!generator) error("Generator not found!");
            let created = generator(component.name, componentLibrary);
            this.components.set(component.name, created);
        }

        template.inputPins.forEach(input => this.inputPins.set(input.name, new Pin(input.name, input.width, input.type, -1)));
        template.outputPins.forEach(output => this.outputPins.set(output.name, new Pin(output.name, output.width, output.type, -1)));

        template.wires.forEach(w => {
            let fromComponent = w.fromComponent ? this.getComponent(w.fromComponent) : this;
            let fromPin = w.fromComponent ? fromComponent.getOutputPin(w.fromPin) : this.getInputPin(w.fromPin);
            let toComponent = w.toComponent ? this.getComponent(w.toComponent) : this;
            let toPin = w.toComponent ? toComponent.getInputPin(w.toPin) : this.getOutputPin(w.toPin);
            this.wires.push(new Wire(w.name, fromComponent, fromPin, toComponent, toPin));
        });
    }

    exportTemplate(): ComponentTemplate {
        let r = new ComponentTemplate();
        r.type = this.type;
        r.inputPins = [];
        r.components = [];
        r.outputPins = [];
        r.wires = [];
        this.inputPins.forEach(pin => r.inputPins.push({name: pin.name, width: pin.width, type: pin.type}));
        this.components.forEach(component => r.components.push({name: component.name, type: component.type}));
        this.outputPins.forEach(pin => r.outputPins.push({name: pin.name, width: pin.width, type: pin.type}));
        this.wires.forEach(wire => r.wires.push({
            name: wire.name,
            fromComponent: wire.fromComponent === this ? null : wire.fromComponent.name,
            fromPin: wire.fromPin.name,
            toComponent: wire.toComponent === this ? null : wire.toComponent.name,
            toPin: wire.toPin.name,
        }));
        return r;
    }

    getComponent(name: string) {
        let component = this.components.get(name);
        if (!component) error("Component not found!");
        return component;
    }

    getInputPin(name: string) {
        let pin = this.inputPins.get(name);
        if (!pin) error("Pin not found!");
        return pin;
    }

    getOutputPin(name: string) {
        let pin = this.outputPins.get(name);
        if (!pin) error("Pin not found!");
        return pin;
    }

    getInputValues() {
        let inputs: { [key: string]: number } = {};
        for (let pin of this.inputPins.values()) {
            inputs[pin.name] = pin.read();
        }
        return inputs;
    }

    getOutputValues() {
        let outputs: { [key: string]: number } = {};
        for (let pin of this.outputPins.values()) {
            outputs[pin.name] = pin.read();
        }
        return outputs;
    }

    applyInputValues(inputs: { [key: string]: number }) {
        for (let key of Object.keys(inputs)) {
            let pin = this.inputPins.get(key);
            if (pin) {
                let value = inputs[key];
                value = value & ((1 << pin.width) - 1);
                pin.write(value, pin.width);
            }
        }
    }

    applyOutputValues(outputs: { [key: string]: number }) {
        for (let key of Object.keys(outputs)) {
            let pin = this.outputPins.get(key);
            if (pin) {
                let value = outputs[key];
                value = value & ((1 << pin.width) - 1);
                pin.write(value, pin.width);
            }
        }
    }

    needRun: boolean = false;

    run() {
    }

}

export type ComponentLogic = (inputs: { [key: string]: number }, outputs: { [key: string]: number }) => void;

export class ComponentBuiltin extends Component {
    private readonly logic: ComponentLogic;

    constructor(name: string, template: ComponentTemplate, componentLibrary: Map<string, ComponentGenerator>, logic: ComponentLogic) {
        super(name, false, template, componentLibrary);
        this.needRun = true;
        this.logic = logic;
    }

    run() {
        if (this.needRun) {
            let inputs = this.getInputValues();
            let outputs: { [key: string]: number } = {};
            this.logic(inputs, outputs);
            this.applyOutputValues(outputs);
        }
    }
}