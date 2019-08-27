rustc --target wasm32-unknown-unknown --crate-type cdylib -O example.rs
wasm-opt -O2 --asyncify example.wasm -o example.wasm
