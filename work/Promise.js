/*
自定义Promise函数模块
 */
(function (window) {

  /*
  Promise构造函数
   */
  function Promise(excutor) {
    const self = this // 将promise对象保存到self变量
    self.status = 'pending' // 状态属性, 初始为pending, 代表结果还未确定
    self.data = undefined // 数据属性, 用来保存成功/失败的数据, 当前还没有值
    /*
    callbacks的结构
      [
        { onRsolved () {}, onRejected () {}},
        { onRsolved () {}, onRejected () {}},
      ]
     */
    self.callbacks = [] // 用来存储所有待执行的成功/失败的回调函数

    /*
    由Promise内部定义, 但由使用者调用的函数
    用来指定成功状态及成功的值
     */
    function resolve(value) {
      // 只有在当前状态是pending才需要更新
      if (self.status === 'pending') {
        // 指定成功的状态值
        self.status = 'resolved'
        // 指定成功的数据
        self.data = value

        // 立即异步执行所有存储在callbacks中待执行的onResolved函数
        setTimeout(() => {
          self.callbacks.forEach(cbObj => cbObj.onResolved(value))
        })
      }
    }

    /*
    由Promise内部定义, 但由使用者调用的函数
    用来指定失败状态及失败的原因
     */
    function reject(reason) {

      if (self.status === 'pending') {
        // 指定失败的状态值
        self.status = 'rejected'
        // 指定成功的数据
        self.data = reason

        // 立即异步执行所有存储在callbacks中待执行的onRejected函数
        setTimeout(() => {
          self.callbacks.forEach(cbObj => cbObj.onRejected(reason))
        })
      }
    }

    // 立即同步执行excutor函数
    try {
      excutor(resolve, reject)
    } catch (error) { // 捕获到异常, 更新为失败
      reject(error)
    }

  }

  /*
    用来指定成功和失败的回调函数的方法
    返回值是一个新的promise对象
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this
    let promise2

    // 如果onResolved/onRejected不是函数, 专门指定一个函数
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason}


    if (self.status==='resolved') {
      promise2 = new Promise((resolve, reject) => {
        // 立即异步调用成功的回调
        setTimeout(() => {
          try {
            const x = onResolved(self.data)
            if(x instanceof Promise) { // 将x的结果作为promise2的结果
              /*x.then(
                value => {
                  resolve(value)
                },
                reason => {
                  reject(reason)
                }
              )*/
              x.then(resolve, reject)
            } else { // 回调函数返回的不是promise
              resolve(x)
            }
          } catch (error) { // 如果出了异常, promise2确定为失败
            reject(error)
          }

        })
      })
    } else if (self.status==='rejected') {
      promise2 = new Promise((resolve, reject) => {
        // 立即异步调用成功的回调
        setTimeout(() => {
          try {
            const x = onRejected(self.data)
            if(x instanceof Promise) { // 将x的结果作为promise2的结果
              x.then(resolve, reject)
            } else { // 回调函数返回的不是promise
              resolve(x)
            }
          } catch (error) { // 如果出了异常, promise2确定为失败
            reject(error)
          }
        })
      })
    } else { // pending
      promise2 = new Promise((resolve, reject) => {
        // 将回调函数保存起来
        self.callbacks.push({
          onResolved (value) {
            try {
              const x = onResolved(self.data)
              if(x instanceof Promise) { // 将x的结果作为promise2的结果
                x.then(resolve, reject)
              } else { // 回调函数返回的不是promise
                resolve(x)
              }
            } catch (error) { // 如果出了异常, promise2确定为失败
              reject(error)
            }
          },
          onRejected (reason) {
            try {
              const x = onRejected(self.data)
              if(x instanceof Promise) { // 将x的结果作为promise2的结果
                x.then(resolve, reject)
              } else { // 回调函数返回的不是promise
                resolve(x)
              }
            } catch (error) { // 如果出了异常, promise2确定为失败
              reject(error)
            }
          }
        })
      })
    }

    return promise2
  }

  /*
    用来指定失败的回调函数的方法
    返回值是一个新的promise对象
   */
  Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
  }

  /*
  返回一个指定了成功结果值的promise对象
   */
  Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
      // 如果接收的value是一个promise, 将这个promise结果作为返回promise的结果
      if (value instanceof Promise) {
        value.then(resolve, reject)
      } else {
        resolve(value)
      }

    })
  }

  /*
  返回一个指定了失败结果原因的promise对象
   */
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  /*
  返回一个新的promise对象
  只有当所有的promise都成功才是一个成功结果, 一旦有一个promise失败了就会产生一个失败结果
   */
  Promise.all = function (promises) {

    const length = promises.length // 所有promies个数
    let resolvedCount = 0 // 保存已成功promise的个数
    const values = new Array(length) // 保存所有promise成功数据的数组

    return new Promise((resolve, reject) => {
      // 遍历所有promises
      promises.forEach((p, index) => {
        // promises数组中的元素可能不是promise
        Promise.resolve(p).then(
          value => {
            // 保存成功的数据
            values[index] = value
            resolvedCount++
            // 当所有promise都成功了
            if (resolvedCount===length) {
              resolve(values)
            }
          },
          reason => {
            reject(reason)
          }
        )
      })
    })
  }

  // 暴露Promise
  window.Promise = Promise

})(window)


/*
实例对象: 函数的实例对象
函数对象: 将函数作为对象使用
 */