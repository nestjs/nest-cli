import { Foo } from '~/foo';
import { Bar } from '~/bar';
import { Baz } from '~/baz';
import { Qux } from '~/qux';

// use the imports so they do not get eliminated
console.log(Foo);
console.log(Bar);
console.log(Baz);
console.log(Qux);
