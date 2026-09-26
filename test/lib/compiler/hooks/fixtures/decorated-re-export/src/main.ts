export { value } from '~/value';

const Injectable = (): ClassDecorator => () => undefined;

@Injectable()
export class Client {
  readonly name = Client.name;
}
