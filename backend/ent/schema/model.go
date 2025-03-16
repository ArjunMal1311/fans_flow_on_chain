package schema

import "entgo.io/ent"

// Model holds the schema definition for the Model entity.
type Model struct {
	ent.Schema
}

// Fields of the Model.
func (Model) Fields() []ent.Field {
	return nil
}

// Edges of the Model.
func (Model) Edges() []ent.Edge {
	return nil
}
