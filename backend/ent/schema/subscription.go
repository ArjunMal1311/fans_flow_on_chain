package schema

import "entgo.io/ent"

// Subscription holds the schema definition for the Subscription entity.
type Subscription struct {
	ent.Schema
}

// Fields of the Subscription.
func (Subscription) Fields() []ent.Field {
	return nil
}

// Edges of the Subscription.
func (Subscription) Edges() []ent.Edge {
	return nil
}
