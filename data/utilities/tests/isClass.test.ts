import {isClass} from '../isClass';

describe('isClass tests', () => {
  it('should return true if value is a class', () => {
    class MyClass {}

    const result = isClass(MyClass);

    expect(result).instanceOf(MyClass);
  });

  it('should return false if value is a class', () => {
    const NotAClass = {};

    const result = isClass(NotAClass);

    expect(result).toBe(NotAClass);
  });

  it('should throw an error if something goes wrong while checking instance', () => {
    class MyClass {
      constructor() {
        throw new Error('Something went wrong');
      }
    }

    expect(() => isClass(MyClass)).toThrowError(Error);
  });
});
