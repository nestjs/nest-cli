import { Input } from '../commands';
import { AbstractAction } from './abstract.action';
export declare class AddAction extends AbstractAction {
    handle(inputs: Input[]): Promise<void>;
}
