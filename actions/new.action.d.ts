import { Input } from '../commands';
import { AbstractAction } from './abstract.action';
export declare class NewAction extends AbstractAction {
    handle(inputs: Input[], options: Input[]): Promise<void>;
}
export declare const retrieveCols: () => number;
