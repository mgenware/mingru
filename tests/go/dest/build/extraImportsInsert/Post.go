package da

import (
	"time"

	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertTimes ...
func (da *TableTypePost) InsertTimes(queryable sqlx.Queryable, datetime time.Time, n_datetime *time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`datetime`, `n_datetime`) VALUES (?, ?)", datetime, n_datetime)
	return sqlx.GetLastInsertIDUint64WithError(result, err)
}
