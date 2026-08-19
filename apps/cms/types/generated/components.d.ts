import type { Schema, Struct } from '@strapi/strapi';

export interface SharedQueue extends Struct.ComponentSchema {
  collectionName: 'components_shared_queues';
  info: {
    description: '\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0441\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u0416\u041A';
    displayName: 'Queue';
  };
  attributes: {
    building: Schema.Attribute.String;
    delivery: Schema.Attribute.String;
    number: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

export interface SharedRate extends Struct.ComponentSchema {
  collectionName: 'components_shared_rates';
  info: {
    description: '\u0418\u043F\u043E\u0442\u0435\u0447\u043D\u0430\u044F \u0441\u0442\u0430\u0432\u043A\u0430 (\u0442\u0430\u0431 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440\u0430)';
    displayName: 'Rate';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    rate: Schema.Attribute.Float & Schema.Attribute.Required;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.queue': SharedQueue;
      'shared.rate': SharedRate;
    }
  }
}
