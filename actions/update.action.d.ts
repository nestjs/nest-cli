import { Input } from '../commands';
import { AbstractAction } from './abstract.action';
export declare class UpdateAction extends AbstractAction {
    handle(inputs: Input[], options: Input[]): Promise<void>;
}
