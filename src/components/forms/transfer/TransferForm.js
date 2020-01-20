import React, { Component } from 'react';

import './TransferForm.css';


export default class TransferForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            limit: 5000000000,
            used: 0,
            temp: "",
            files: [],
            sender: '',
            recipients: [],
            message: '',
            progress: 0,
            loading: false,
            done: false,
            cdn: 'ec2-35-154-35-230.ap-south-1.compute.amazonaws.com:3000/api/'
        };
    }

    handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('from_email', { email: this.state.sender });
        formData.append('to_email', { ...this.state }.recipients.map(r => (r) => { return { email: r } }));
        formData.append('file', this.state.files);
        formData.append('message', this.state.message);

        const request = new XMLHttpRequest();
        request.open('POST', this.state.cdn);
        request.setRequestHeader('Content-Type', 'multipart/form-data');
        request.upload.addEventListener("progress", ({ loaded, total }) => {
            this.setState({ progress: loaded / total });
        });
        request.onerror = (e) => {
            this.setState({ loading: false });
        };
        request.onabort = (e) => {
            this.setState({ loading: false });
        };
        request.onreadystatechange = (() => {
            if (request.readyState === 4) {
                this.setState({
                    limit: 5000000000,
                    used: 0,
                    temp: "",
                    files: [],
                    recipients: [],
                    message: '',
                    progress: 0,
                    loading: false,
                    done: true
                });
            }
        });
        request.send(formData);

        this.setState({ loading: true });
    }

    handleChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    addRecipient = (event) => {
        event.preventDefault();
        const newState = { ...this.state };
        const newRecipient = newState.temp;
        if (newState.recipients.findIndex(email => email === newRecipient) === -1) {
            newState.recipients.push(newRecipient);
            this.setState({ ...newState, temp: "" });
        }
    }

    removeRecipient = (email) => {
        const newState = { ...this.state };
        const idx = newState.recipients.findIndex(e => e === email);
        if (idx !== -1) {
            newState.recipients.splice(idx, 1);
            this.setState(newState);
        }
    }

    removeFile = (file) => {
        const newState = { ...this.state };
        const idx = newState.files.findIndex(f => f.name === file.name);
        if (idx !== -1) {
            newState.files.splice(idx, 1);
            newState.used = newState.files.reduce((p, c) => p + c.size, 0);
            this.setState(newState);
        }
    }

    addFiles = (files) => {
        const newState = { ...this.state };
        files.forEach(file => {
            const idx = newState.files.findIndex(f => f.name === file.name)
            if (idx === -1) {
                newState.files.push(file);
                newState.used = newState.files.reduce((p, c) => p + c.size, 0);
                this.setState(newState);
                this.scrollTo('recipients');
            }
        });
    }

    chooseFiles = () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("multiple", "multiple");
        input.click();
        input.onchange = (event => {
            const files = event.target.files;
            if (files && files.length > 0) {
                return this.addFiles([...files]);
            }
        });
    }

    scrollTo = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: "smooth" });
    }

    render() {
        const Recipients = () => {
            const emails = [...this.state.recipients];

            return emails.map(email =>
                <li className="recipient" key={email}>
                    <span className="label">{email}</span>
                    <span className="remove" onClick={() => this.removeRecipient(email)}>X</span>
                </li>
            );
        }
        const SelectedFiles = () => {
            const files = [...this.state.files];

            return files.map(file =>
                <li className="file" key={file.name}>
                    <span className="remove" onClick={() => this.removeFile(file)}>X</span>
                    <div className="info">
                        <span className="name">{file.name}</span>
                        <span className="size">{(file.size / 1000000).toFixed(2)} MB</span>
                    </div>
                </li>
            );
        }
        return (
            <div className="transfer">

                <h3 hidden={this.state.loading || this.state.more} className="text-center">Transfer Files Up to 5GB</h3>

                <div className="transfer__fields">

                    <div hidden={!this.state.loading || this.state.done}>
                        <div className="upload__progress text-center">
                            <span className="progress">{(this.state.progress).toFixed(1)}%</span>
                            <span className="label">Transfering files...</span>
                        </div>
                    </div>

                    <div hidden={!this.state.done}>
                        <div className="upload__done text-center">
                            <span className="label">Transfer Complete!</span>
                            <button className="cst__btn" onClick={() => this.setState({ done: false, loading: false })}>Send more files</button>
                        </div>
                    </div>

                    <div hidden={this.state.files.length === 0 || this.state.loading || this.state.done}>

                        <ul className="selected__files">
                            <SelectedFiles />
                        </ul>

                        <div className="text-center">
                            <span className="limit__info">
                                {this.state.files.length} files added - {((this.state.limit - this.state.used) / 1000000000).toFixed(1)}GB remaining
                            </span>
                        </div>

                        <div hidden={this.state.files.length === 0} className="add__more__files text-center" onClick={this.chooseFiles}>
                            <span className="plus">+</span>
                            <span className="label">Add more files</span>
                        </div>

                    </div>

                    <div hidden={this.state.loading || this.state.done} className="transfer__form">

                        <div className="upload__files">
                            <div hidden={this.state.files.length > 0} className="add__files text-center" onClick={this.chooseFiles}>
                                <span className="plus">+</span>
                                <span className="label">Add files</span>
                            </div>
                        </div>

                        <form onSubmit={this.addRecipient}>
                            <div id="recipients" className="transfer__input__wraper">
                                <ul className="selected__emails">
                                    <Recipients />
                                </ul>
                                <input data-temp name="temp" value={this.state.temp} onChange={this.handleChange} type="email" placeholder="Email to" autoComplete="off" required />
                            </div>
                        </form>

                        <form onSubmit={this.handleSubmit}>

                            <div className="transfer__input__wraper">
                                <input name="sender" value={this.state.sender} onChange={this.handleChange} type="email" placeholder="Your email" autoComplete="off" required />
                            </div>

                            <div className="transfer__input__wraper">
                                <textarea name="message" value={this.state.message} onChange={this.handleChange} type="text" placeholder="Message" rows="auto" >
                                </textarea>
                            </div>

                        </form>
                    </div>

                    <div hidden={this.state.loading || this.state.done} className="transfer__action text-center">
                        <button className="transfer__submit cst__btn" onClick={this.handleSubmit}>Transfer</button>
                    </div>

                </div>

            </div>
        );
    }
}
