import React from 'react'
import './styles/Carousel.sass'

export default class extends React.Component<
  {
    width: string
    maxWidth: string
    height: string
    className: string
    auto?: boolean
  },
  {
    activeOn: number
  }
> {
  state = {
    activeOn: 0,
  }
  forward: boolean = false
  length: number
  css: string
  auto: boolean = false
  interval: NodeJS.Timeout | null = null
  initial: boolean = true

  constructor(props: any) {
    super(props)
    this.length = React.Children.count(props.children)
    this.prevSlide = this.prevSlide.bind(this)
    this.nextSlide = this.nextSlide.bind(this)
    this.nextPress = this.nextPress.bind(this)
    this.prevPress = this.prevPress.bind(this)

    if (props.auto) {
      this.auto = true
    }

    this.css = ''
    const imgW = 100 / this.length

    this.css += `@keyframes init { 0% {transform: translate(0, 0)} 100% {transform: translate(0, 0)}}\n`
    for (let i = 0; i < this.length; i++) {
      if (i === this.length - 1) {
        this.css += `@keyframes nextSlide-${0} {`
        this.css += `0% { transform: translate(-${imgW * i}%, 0)}`
        this.css += `100% { transform: translate(-${imgW}%, 0)}}\n`
      } else {
        this.css += `@keyframes nextSlide-${i+1} {`
        this.css += `0% { transform: translate(-${imgW * (i)}%, 0)}`
        this.css += `100% { transform: translate(-${imgW * (i+1)}%, 0)}}\n`
      }

      if (i === 0) {
        this.css += `@keyframes prevSlide-${this.length-1} {`
        this.css += `0% { transform: translate(-${imgW}%, 0)}`
        this.css += `100% { transform: translate(-${imgW * (this.length-1)}%, 0)}}\n`
      } else {
        this.css += `@keyframes prevSlide-${i-1} {`
        this.css += `0% { transform: translate(-${imgW * i}%, 0)}`
        this.css += `100% { transform: translate(-${imgW * (i-1)}%, 0)}}\n`
      }
    }
  }

  render() {
    const { children, width, height, maxWidth } = this.props
    const buttonWidth = '4em'
    const windowWidth = `calc(100% - 2 * ${buttonWidth})`

    const slides = React.Children.toArray(children).map((e, index) => {
      return (
        <div
          className="carousel-item"
          key={`div-item-${index}`}
          style={{ width: `${100 / this.length}%`, maxHeight: height }}
        >
          {e}
        </div>
      )
    })


    if (slides.length === 0) throw new Error('Carousel must have at least one child')

    const indicators: JSX.Element[] = []
    for (let i = 0; i < this.length; i++) {
      if (i === this.state.activeOn) {
        indicators.push(<li key={`li-${i}`} className="active" />)
      } else {
        indicators.push(<li key={`li-${i}`} />)
      }
    }

    const anim = this.forward
      ? `nextSlide-${this.state.activeOn}`
      : `prevSlide-${this.state.activeOn}`

    return (
      <div
        className="carousel"
        style={{
          width,
          height,
          maxWidth,
        }}
      >
        <style>{this.css}</style>
        <div className="top">
          <div className="button" onClick={this.prevPress}>
            <div className="left" />
          </div>
          <div className="items" style={{ flexBasis: windowWidth }}>
            <div
              className="photo-window"
              style={{
                width: `${100 * this.length}%`,
                animationName: this.initial ? 'init' : anim,
              }}
            >
              {slides}
            </div>
          </div>
          <div className="button" onClick={this.nextPress}>
            <div className="right" />
          </div>
        </div>
        <ul className="indicators">{indicators}</ul>
      </div>
    )
  }

  componentDidMount() {
    if (this.auto) {
      if (this.interval) {
        clearInterval(this.interval)
      }
      this.interval = setInterval(this.nextSlide, 3000)
    }
    this.initial = false
  }

  nextPress() {
    this.componentDidMount()
    this.nextSlide()
  }

  prevPress() {
    this.componentDidMount()
    this.prevSlide()
  }

  nextSlide() {
    this.forward = true
    this.setState({
      activeOn: (this.state.activeOn + 1) % this.length,
    })
  }

  prevSlide() {
    this.forward = false
    if (this.state.activeOn !== 0) {
      this.setState({
        activeOn: (this.state.activeOn - 1) % this.length,
      })
    } else {
      this.setState({
        activeOn: this.length - 1,
      })
    }
  }
}
