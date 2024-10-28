// TODO: This is a WIP. Completely disregard this file

/*
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import escape from "$shared/escape";

/**
 * This whole file encompasses the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API WebAuthn}, {@link https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API FedCM}, {@link https://wicg.github.io/web-otp WebOTP} APIs
 *\/

import {
    type APIInterceptor,
    ExposedContextsEnum
} from "$types/apiInterceptors.d.ts";

import { proxyLocation } from "$shared/proxyLocation";
import { afterPrefix } from "$shared/getProxyUrl";
import type BareClient from "@mercuryworkshop/bare-mux";

const credentialStore = new WeakMap<PasswordCredential, PasswordCredential>();
const publicKeyCredentialStore = new WeakMap<
    PublicKeyCredential,
    PublicKeyCredential
>();

// Credential Classes
// From WebAuthn
const passwordCredential = new WeakMap<
    PasswordCredential,
    PasswordCredential
>();
const federatedCredential = new WeakMap<
    FederatedCredential,
    FederatedCredential
>();
const publicKeyCredential = new WeakMap<
    PublicKeyCredential,
    PublicKeyCredential
>();
// FedCM (draft)
const identityCredential = new WeakMap<
    IdentityCredential,
    IdentityCredential
>();
const otpCredential = new WeakMap<OTPCredential, OTPCredential>();

/** @see {@link https://w3c.github.io/webauthn/#dictdef-collectedclientdata} *\/
interface CollectedClientData {
    readonly type: string;
    readonly challenge: string;
    readonly origin: string;
    readonly topOrigin: string;
    readonly crossOrigin: boolean;
}

function proxifyCredentials(credentials: Credential): Credential {
    const proxifiedCredentials: Credential = credentials;

    /**
     * @see {@link https://w3c.github.io/webappsec-credential-management/#credential-type-registry-credential-type CredentialTypeRegistry}
     * It seems as if MDN's resource for the credential types is not updated yet to reflect the FedCM Credential Types
     *\/
switch (credentials.type) {
    /**
     * @see {@link https://w3c.github.io/webappsec-credential-management/#federatedcredential-interface FederatedCredential}
     *\/
    case "federated":
        break;
    /**
     * @see
     *\/
    case "identity":
        break;
    /**
     * @see {@link https://wicg.github.io/web-otp/#otpcredential OTPCredential}
     *\/
    case "otp":
        //
        const otpCredentials = proxifiedCredentials as OTPCredential;
        // OTP doesn't need rewrites

        break;
    /**
     * @see {@link https://w3c.github.io/webappsec-credential-management/#passwordcredential-interface PasswordCredential}
     *\/
    case "password":
        break;
    /**
     * @see {@link https://w3c.github.io/webauthn/#publickeycredential PublicKeyCredential}
     *\/
    case "public-key":
        break;
    default:
        $aero.logger.fatalErr("FedCM", "Unknown credential type");
}
return proxifiedCredentials;
}
*/

/*
export default [
    {
        // TODO: Support the rest of the navigator.credentials API - https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer
        proxifiedObj: Proxy.revocable(navigator.credentials.store, {
            apply(target, that, args) {
                const [credentialsObj] = args;

                const proxifiedCredentialObj = {
                    federated: {
                        id: escape(credentialsObj.id)
                    },
                    ...credentialsObj
                };

                // @ts-ignore
                const proxifiedCredentials = Reflect.construct(
                    target,
                    that,
                    args.shift().push(proxifiedCredentialObj)
                ) as PasswordCredential;
                // @ts-ignore
                const credentials = Reflect.construct(
                    target,
                    that,
                    args
                ) as PasswordCredential;

/*
There is no point of backing it up if it doesn't have what we need. We know it will error anyways
*\/
if (
    "federated" in credentialsObj &&
    "id" in credentialsObj.federated
)
    credentialStore.set(proxifiedCredentials, credentials);
}
}),
globalProp: "navigator.credentials",
exposedContexts: ExposedContextsEnum.window
},
{
proxifiedObj: Proxy.revocable(navigator.credentials.store, {
apply(_target, _that, args) {
const credentialsObj: Credential = args[0];

args[0] = proxifyCredentials(credentialsObj);
}
}),
globalProp: "navigator.credentials.store",
exposedContexts: ExposedContextsEnum.window
},
{
proxifiedObj: Proxy.revocable(navigator.credentials.get, {
apply(target, that, args) {
const options: CredentialRequestOptions = args[0];

if (!options)
    // Return to normal operations and let the browser throw its proper exception
    return Reflect.apply(target, that, args);

const newOptions = options;

// https://w3c.github.io/webappsec-credential-management/#dictdef-federatedcredentialrequestoptions
newOptions.federated = {
    /*
    It requires an origin; the path does not matter. The plan is to use passwords later on and do the escaping server-side on a [Bare Extended](https://github.com/tomphttp/specifications-v4/blob/master/optional-specs/BareExtended.md) endpoint to route to the correct identity provider. 😬
    @see {@link https://w3c.github.io/webappsec-credential-management/#provider-identification:~:text=the%20origin%20the%20provider%20uses%20for%20sign%20in}
    *\/
    providers: options.federated.providers.map(
        _provider => location.origin
    )
};

const newArgs = args;
args[0] = options;

const keyCredential = Reflect.apply(target, that, newArgs);
if (keyCredential instanceof PublicKeyCredential) {
    const proxifiedPublicKeyCredential: PublicKeyCredential = {
        ...keyCredential
    };

    /**
     * @see {@link https://w3c.github.io/webauthn/#dom-authenticatorresponse-clientdatajson}
     * @see {@link https://w3c.github.io/webauthn/#dictdef-collectedclientdata}
     *\/
    const clientData = JSON.parse(
        new TextDecoder().decode(
            keyCredential.response.clientDataJSON
        )
    ) as CollectedClientData;

    const proxifiedClientData = clientData;

    Object.defineProperties(proxifiedClientData, {
        type: {
            // Make readonly
            writable: false,
            configurable: false
        },
        origin: {
            // @ts-ignore
            value: proxyLocation().origin,
            // Make readonly
            writable: false,
            configurable: false
        },
        topOrigin: {
            // @ts-ignore
            value: proxyLocation({
                // Make this an actual option lol
                topLevel: true
            }).origin,
            // Make readonly
            writable: false,
            configurable: false
        },
        crossOrigin: {
            // @ts-ignore
            value:
                new URL(afterPrefix(clientData.origin))
                    .origin !== proxyLocation().origin,
            // Make readonly
            writable: false,
            configurable: false
        }
    });

    Object.defineProperty(
        proxifiedPublicKeyCredential.response,
        "clientDataJSON",
        {
            // @ts-ignore
            value: new TextEncoder().encode(
                JSON.stringify(proxifiedClientData)
            ),
            // Make readonly
            writable: false,
            configurable: false
        }
    );

    return proxifiedPublicKeyCredential;
} else {
    return keyCredential;
}
}
}),
globalProp: "navigator.credentials.get",
exposedContexts: ExposedContextsEnum.window
}
// TODO: Support the rest of the Credential Management APIs - https://developer.mozilla.org/en-US/docs/Web/API/Credential_Management_API
] as APIInterceptor[];
*/
