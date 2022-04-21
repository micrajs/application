import {getInstanceOf} from '../getInstanceOf';

describe('getInstanceOf tests', () => {
  it('should return true if value is a class', () => {
    class MyClass {}

    const result = getInstanceOf(MyClass);

    expect(result).instanceOf(MyClass);
  });

  it('should return false if value is a class', () => {
    const NotAClass = {};

    const result = getInstanceOf(NotAClass);

    expect(result).toBe(NotAClass);
  });

  it('should throw an error if something goes wrong while checking instance', () => {
    class MyClass {
      constructor() {
        throw new Error('Something went wrong');
      }
    }

    expect(() => getInstanceOf(MyClass)).toThrowError(Error);
  });
});
