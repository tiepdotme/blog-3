---
id: const-and-reference-member-variables
title: "The implication of const or reference member variables in C++"
lang: en
create: '2020-08-18'
lastModify: '2020-08-18'
categories:
- code
- cpp
---

In the conventional wisdom of the C++ community,
`const` or reference member variables are considered problematic.
Surprisingly, I cannot find a single resource dedicated to this topic.

I decide to write this post because the same problem raises several time by different people on Twitter and the [#include ＜C++＞ discord server](https://discord.com/invite/ZPErMGW).
There are solid reasons on why you should avoid `const` or reference member variables in C++.
Nevertheless, like many things in C++, "avoid" does not mean "never use."
And they can occasionally still find some uses.

## Const members

If you are familiar with any programming languages, such as Rust, that treat `const` as default and mutable as second class citizens, you may have the temptation to mark fields `const` if you don't need to modify them. Alas, in C++, every best practice has a twist, such as "`const` everything *except* member variables."

`const` member variables disables *assignment* and *move semantics*.
For assignments, it makes sense, since how can you assign something to a constant?
For move semantics, even though technically copy is a valid move implementation, the type system cannot guarantee that the after-move state remains the same.

"What is the big deal? I already said that I don't want to mutate the fields ever." you may ask.

Except that `swap` uses both *assignment* and *move semantics*.

```cpp
struct BadImmutablePoint {
    const int x = 0;
    const int y = 0;
};

int main() {
  BadImmutablePoint p1;
  BadImmutablePoint p2 {42, 55};
  std::swap(p1, p2); // Error
}
```

That also means no to all STL facilities that use assignments internally.
For example, `std::sort`:

```cpp
std::vector<BadImmutablePoint> points;
// Sort by x-axis
std::ranges::sort(points, {}, &BadImmutablePoint::x); // Error
```

## But I don't want to mutate the member variable!

The best thing you can do in C++ is to make the member variable `private` and only expose the getter.
Accessing control still doesn't prevent the class internals from modifying the members, but at least now everything outside the class can't.

```cpp
class ImmutablePoint {
    int x_ = 0;
    int y_ = 0;

public:
    constexpr ImmutablePoint() = default;
    constexpr ImmutablePoint(int x, int y) : x_{x}, y_{y} {}
    [[nodiscard]] constexpr auto x() const -> int { return x_; }
    [[nodiscard]] constexpr auto y() const -> int { return y_; }
};

int main() {
    std::vector<ImmutablePoint> points;
    ...
    std::ranges::sort(points, {}, &ImmutablePoint::x); // Ok
}
```

It is quite a bit of boilerplate.
And to be honest, I will stick with aggregate with none-constant fields in this particular case.
When you create a point variable, you can still mark the whole point as `const`.

If you want to get *really* fancy, you can even create a small template to automate the above process. Though I myself will certainly not go this far.

```cpp
template <typename T>
class const_wrapper {
    T val_;
public:
    constexpr const_wrapper(const T& val) : val_{val} {}
    constexpr const_wrapper(T&& val) : val_{std::move(val)} {}

    [[nodiscard]] constexpr auto get() const -> const T& { return val_; }
    [[nodiscard]] constexpr operator T() const { return val_; }
};
```

Then you can use this template as following:

```cpp
struct ImmutablePoint {
    const_wrapper<int> x = 0;
    const_wrapper<int> y = 0;
};

int main() {
    std::vector<ImmutablePoint> points;
    ...
    std::ranges::sort(points, {}, &ImmutablePoint::x); // Ok
}
```

## Reference member variables

Since C++ references cannot rebind, we have a situation very similar to `const` members.
A good analogy of references is a `const` pointer that cannot be null.
For example, the below `struct` subjects to the same problem of the `struct` with `const` fields.

```cpp
struct BadImmutableTriangle {
    const ImmutablePoint& a;
    const ImmutablePoint& b;
    const ImmutablePoint& c;
};
```

Like the solutions for const data members,
instead of storing a reference data member,
we can store a pointer member and only expose a reference getter.

```cpp
class ImmutableTriangle {
    const ImmutablePoint* a_;
    const ImmutablePoint* b_;
    const ImmutablePoint* c_;

public:
    // No default constructor
    constexpr ImmutableTriangle(
        const ImmutablePoint& a,
        const ImmutablePoint& b,
        const ImmutablePoint& c)
        : a_{&a}, b_{&b}, c_{&c} {}

    [[nodiscard]] constexpr auto a() const -> const ImmutablePoint& { return *a_; }
    [[nodiscard]] constexpr auto b() const -> const ImmutablePoint& { return *b_; }
    [[nodiscard]] constexpr auto c() const -> const ImmutablePoint& { return *c_; }
};
```

The C++ standard library ships a [`std::reference_wrapper`](https://en.cppreference.com/w/cpp/utility/functional/reference_wrapper) helper template and it function a lot like our `const_wrapper` above.

```cpp
struct ImmutableTriangle {
    std::reference_wrapper<const ImmutablePoint> a;
    std::reference_wrapper<const ImmutablePoint> b;
    std::reference_wrapper<const ImmutablePoint> c;
};
```

`std::reference_wrapper` is especially useful when we try to store something in the container while still maintains reference semantics:

```cpp
std::vector<ImmutableTriangle&> triangles1; // Error
std::vector<std::reference_wrapper<ImmutableTriangle>> triangles2; // Ok, reference semantic
std::vector<ImmutableTriangle*> triangles3; // Ok, value semantic of pointers
```

## Where `const` or reference member variables can still be useful

In some cases,
you already disabled the assignment and move operations, or you need to write your own anyway.
One of the primary examples is inheritance hierarchies.
And in those cases, it is fine to use `const` or reference member variables.

## Conclusion

C++, at its core, is an imperative language built on C heritage, and `const` and references are afterthought of the language.
Also, The core language mechanisms heavily rely on mutation. Like it or not, when writing C++ classes, restricting user's freedom to mutate member variables is not well supported.