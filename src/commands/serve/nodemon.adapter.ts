import * as nodemon from 'nodemon';

export class NodemonAdapter {
  public static start(parameters) {
    nodemon(parameters);
  }
}
