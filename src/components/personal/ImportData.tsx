'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportResult {
  rowsImported: number
  rowsSkipped: number
  importId: string
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error'

export function ImportData() {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [source, setSource] = useState('csv')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setStatus('idle')
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleImport = async () => {
    if (!selectedFile) return

    setStatus('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('source', source)

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setStatus('error')
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setStatus('idle')
    setResult(null)
    setError(null)
  }

  const sources = [
    { value: 'csv', label: 'Generic CSV', desc: 'Standard CSV with date, description, amount columns' },
    { value: 'chase', label: 'Chase Bank', desc: 'Chase bank statement export' },
    { value: 'boa', label: 'Bank of America', desc: 'Bank of America export' },
    { value: 'wellsfargo', label: 'Wells Fargo', desc: 'Wells Fargo export' },
    { value: 'amex', label: 'American Express', desc: 'Amex statement export' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-cyan-400 mb-1">Import Financial Data</h2>
        <p className="text-sm text-gray-500">Upload CSV files from your bank or financial institution</p>
      </div>

      {/* Source Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Data Source</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sources.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={cn(
                'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                source === s.value
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-white/3 text-gray-400 hover:bg-white/5'
              )}
            >
              <span className="text-xs font-semibold">{s.label}</span>
              <span className="text-xs text-gray-600 mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-cyan-400 bg-cyan-500/10'
            : selectedFile
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/3'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {selectedFile ? (
            <>
              <FileText className="w-10 h-10 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-400">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); reset() }}
                className="text-xs text-gray-500 hover:text-red-400 underline"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <Upload className={cn('w-10 h-10', isDragActive ? 'text-cyan-400' : 'text-gray-600')} />
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                </p>
                <p className="text-xs text-gray-600 mt-1">or click to browse · Max 10MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSV Format Help */}
      <div className="glass rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-400 mb-2">Expected CSV format:</p>
        <code className="block bg-black/40 rounded p-2 text-cyan-400/70">
          Date,Description,Amount,Type,Category<br />
          2024-01-15,&quot;Coffee Shop&quot;,-4.50,debit,Food<br />
          2024-01-15,&quot;Salary Deposit&quot;,5000.00,credit,Income
        </code>
        <p className="mt-2">Columns are auto-detected. Amount can be negative for debits.</p>
      </div>

      {/* Status Messages */}
      {status === 'success' && result && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-400">Import Successful!</p>
            <p className="text-xs text-gray-400 mt-1">
              Imported {result.rowsImported} transactions · Skipped {result.rowsSkipped} rows
            </p>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Import Failed</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={!selectedFile || status === 'uploading'}
          loading={status === 'uploading'}
          className="flex-1"
        >
          {status === 'uploading' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Import Transactions
            </>
          )}
        </Button>
        {(selectedFile || result) && (
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-yellow-400">Import Tips</p>
            <p>• Transactions are automatically categorized based on description</p>
            <p>• Duplicate detection is not currently enabled</p>
            <p>• You can edit categories after import in the Transactions view</p>
          </div>
        </div>
      </div>
    </div>
  )
}
