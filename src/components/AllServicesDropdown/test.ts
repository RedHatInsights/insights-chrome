interface ClassOf<T> {
  new (...args: any[]): T;
}

const extendClass =
  <T, S extends Record<string, (...args: any[]) => Promise<any>>>(class_: ClassOf<T>, dynamicMethods: S) =>
  (...args: any[]) => {
    const o = new class_(args) as T & S;
    for (const key of Object.keys(dynamicMethods) as Array<keyof S>) {
      const method = dynamicMethods[key];
      (o as S)[key] = method; // type sig seems unnecessary
    }
    return o;
  };

// demo:
class CustomINstance {}

const extHelloConstr = extendClass(CustomINstance, { getGroups: (query: string) => Promise.resolve(query) });
const extHello = extHelloConstr('jimmy');
const somePromise = extHello.getGroups('foobar');
console.log(somePromise);
